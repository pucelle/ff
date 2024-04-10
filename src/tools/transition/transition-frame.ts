import {EasingFunction, TransitionEasingName, getEasingFunction} from './easing'
import {MathUtils} from '../../math'
import {makeMixer} from './mixer'
import {EventFirer} from '../../events'
import {FrameLoop, Timeout} from '../../utils'


/** Transition events. */
export interface TransitionEvents<T> {

	/** On each time progress got update. */
	'progress': (value: T, progress: number) => void

	/** After begin to play transition. */
	'started': () => void

	/** After continue to play transition. */
	'continued': () => void

	/** After transition was cancelled. */
	'cancelled': () => void

	/** After transition become finished. */
	'finished': () => void

	/** After transition end. */
	'ended': (finish: boolean) => void
}


/** Transition options. */
export interface TransitionOptions {

	/** 
	 * Specifies default transition duration in millseconds.
	 * Default value is `200`.
	 */
	duration: number

	/** 
	 * Specifies default transition easing type.
	 * Default value is `ease-out-quad`.
	 */
	easing: TransitionEasingName

	/** Transition delay in milliseconds. */
	delay: number
}


const DefaultTransitionOptions: TransitionOptions = {
	duration: 200,
	easing: 'ease-out-quad',
	delay: 0,
}


/** Transiton between start and end values per frame. */
export class FrameTransition<T extends TransitionableValue = any> extends EventFirer<TransitionEvents<T>> {

	/** Default transition options. */
	static DefaultOptions: TransitionOptions = DefaultTransitionOptions

	/** Play transition with configuration, and between start and end values. */
	static playBetween<T extends TransitionableValue>(
		startValue: T,
		endValue: T,
		handler: (value: T, progress: number) => void,
		duration: number = DefaultTransitionOptions.duration,
		easing: TransitionEasingName = DefaultTransitionOptions.easing,
	): Promise<boolean>
	{
		let transition = new FrameTransition({duration, easing})
		transition.on('progress', handler)

		return transition.playBetween(startValue, endValue)
	}


	/** Calculated easing function. */
	private easingFn: EasingFunction | null = null

	/** Options after fullfilled default values. */
	private fullOptions: TransitionOptions

	/** Timeout when transition delay exist. */
	private delayTimeout: Timeout

	/** Animation frame loop. */
	private frameLoop: FrameLoop

	/** Transition promise. */
	private promise: Promise<boolean> | null = null

	/** 
	 * Be resolved after transition end.
	 * Resolve paramter is whether transition finished.
	 */
	private resolve: ((finished: boolean) => void) | null = null

	/** Help to mix values. */
	private mixer: Mixer<T> | null = null

	/** 
	 * Start value.
	 * Readonly outside.
	 */
	startValue: T | null = null

	/** 
	 * End value.
	 * Readonly outside.
	 */
	endValue: T | null = null

	/** 
	 * Current value.
	 * Readonly outside.
	 */
	currentValue: T | null = null

	/** 
	 * Current transition progress, betweens `0~1`,
	 * before easing mapped.
	 * Readonly outside.
	 */
	progress: number = 0

	constructor(options: Partial<TransitionOptions> = {}) {
		super()
		this.fullOptions = {...DefaultTransitionOptions, ...options}
		this.delayTimeout = new Timeout(this.startTransition.bind(this), this.fullOptions.delay)
		this.frameLoop = new FrameLoop(this.onFrameLoop.bind(this))
	}

	/** Whether transition is playing, or within delay period. */
	get running(): boolean {
		return !!this.promise
	}

	/** 
	 * Whether transition is playing.
	 * Within delay period means not playing.
	 */
	get playing(): boolean {
		return !!this.frameLoop.running
	}

	/** 
	 * Update transition options.
	 * Return whether any option has changed.
	 */
	assignOptions(options: Partial<TransitionOptions> = {}): boolean {
		let changed = false

		for (let [key, value] of Object.entries(options) as Iterable<[keyof TransitionOptions, any]>) {
			if (this.fullOptions[key] !== value) {
				(this.fullOptions as any)[key] = value as any
				changed = true
			}
		}

		return changed
	}

	/** 
	 * Be resolved after transition end.
	 * Resolve parameter is whether transition finished.
	 * If is not playing, resolved by `true`.
	 */
	async untilEnd(): Promise<boolean> {
		if (this.promise) {
			return this.promise
		}
		else {
			return true
		}
	}

	/** 
	 * Set play from values.
	 * Only cancel current transition and update start values.
	 * Returns `this`.
	 */
	playFrom(startValue: T): this {
		this.cancel()
		this.startValue = startValue
		this.currentValue = startValue

		return this
	}

	/** 
	 * Play from current value to end value.
	 * Returns a promise which will be resolved after transition end.
	 * Work only when start value was set before.
	 */
	playTo(endValue: T): Promise<boolean> {
		if (this.startValue === null) {
			throw new Error(`Must call "playFrom" or "playBetween" firstly!`)
		}

		this.cancel()
		
		this.startValue = this.currentValue
		this.endValue = endValue
		this.mixer = makeMixer(this.currentValue!, endValue)

		return this.startDeferred()
	}

	/** 
	 * Play between from and to values.
	 * Returns a promise which will be resolved after transition end.
	 */
	playBetween(startValue: T, endValue: T): Promise<boolean> {
		this.cancel()
		
		this.startValue = startValue
		this.endValue = endValue
		this.currentValue = startValue
		this.mixer = makeMixer(startValue, endValue)
		this.easingFn = getEasingFunction(this.fullOptions.easing)

		return this.startDeferred()
	}

	/** Start transition after delay milliseconds. */
	private startDeferred(): Promise<boolean> {
		if (this.running) {
			this.fire('continued')
		}
		else {
			this.fire('started')
		}

		this.delayTimeout.start()

		this.promise = new Promise(resolve => {
			this.resolve = resolve
		}) as Promise<boolean>

		return this.promise
	}

	/** Start new transition immediately. */
	private startTransition() {
		this.frameLoop.start()
	}

	/** On each animation frame. */
	private onFrameLoop(duration: number) {
		let x = MathUtils.linearStep(duration, 0, this.fullOptions.duration)
		this.onProgress(x)

		// Finished.
		if (x === 1) {
			this.onFinish()
		}
	}

	/** Handle progress. */
	private onProgress(x: number) {
		let y = this.easingFn!(x)
		this.progress = x
		this.currentValue = this.mixer!(y)
		this.fire('progress', this.currentValue, x)
	}

	/** After transition finished. */
	private onFinish() {
		this.fire('finished')
		this.end(true)
	}

	/** 
	 * Finish current transition immediately,
	 * and apply final state.
	 */
	finish() {
		if (!this.running) {
			return
		}

		this.onProgress(1)
		this.fire('finished')
		this.end(true)
	}
	
	/** 
	 * Cancel current transition if is playing.
	 * Note after cancelled, will keep it's current state, but not apply final state.
	 */
	cancel() {
		if (!this.running) {
			return
		}

		this.fire('cancelled')
		this.end(false)
	}

	/** End, either finish or cancel. */
	private end(finish: boolean) {
		this.delayTimeout.cancel()
		this.frameLoop.cancel()
		this.promise = null
		this.mixer = null

		if (this.resolve) {
			this.resolve(finish)
			this.resolve = null
		}

		this.fire('ended', finish)
	}
}
