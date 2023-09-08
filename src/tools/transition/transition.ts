import {EasingFunction, PerFrameEasingName, getEasingFunction} from './easing'
import {MathUtils} from '../../math'
import {FrameLoop, Timeout} from '../time-control'
import {makeMixer} from './mixer'
import {EventFirer} from '../../core'
import {ObjectUtils} from '../../utils'


/** Transition events. */
export interface TransitionEvents<T> {

	/** On progress got update. */
	'progress': (value: T, progress: number) => void

	/** Begin to play transition. */
	'started': () => void

	/** Continue to play transition. */
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
	easing: PerFrameEasingName

	/** Transition delay in milliseconds. */
	delay: number
}


const DefaultTransitionOptions: TransitionOptions = {
	duration: 200,
	easing: 'ease-out-quad',
	delay: 0,
}


/** Make intermiediate values from start and end values. */
export class Transition<T extends TransitionableValue = any> extends EventFirer<TransitionEvents<T>> {

	/** Default transition options. */
	static DefaultOptions: TransitionOptions = DefaultTransitionOptions

	/** 
	 * Play transition with configuration, and between from and to values.
	 * Will apply start state immediately.
	 */
	static playBetween<T extends TransitionableValue>(
		fromValue: T,
		toValue: T,
		handler: (value: T, progress: number) => void,
		duration: number = DefaultTransitionOptions.duration,
		easing: PerFrameEasingName = DefaultTransitionOptions.easing,
	): Promise<boolean> {
		let transition = new Transition({duration, easing})
		transition.on('progress', handler)
		return transition.playBetween(fromValue, toValue)
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
	fromValue: T | null = null

	/** 
	 * End value.
	 * Readonly outside.
	 */
	toValue: T | null = null

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
	 * Update options.
	 * Currently playing transition will be stopped and continue with new options.
	 * `looseOptions` may have much more properties than required.
	 */
	assignOptions(looseOptions: Partial<TransitionOptions> = {}) {
		let changed = ObjectUtils.assignExisted(this.fullOptions, looseOptions)

		// Replay transition.
		if (changed && this.playing) {
			this.playTo(this.toValue!)
		}
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
	 * Play between from and to values.
	 * Will apply start state immediately.
	 */
	playBetween(fromValue: T, toValue: T): Promise<boolean> {
		this.cancel()
		
		this.fromValue = fromValue
		this.toValue = toValue
		this.currentValue = fromValue
		this.mixer = makeMixer(fromValue, toValue)
		this.easingFn = getEasingFunction(this.fullOptions.easing)

		return this.startDeferredTransition()
	}

	/** 
	 * Play from current value to new to value.
	 * Work only when transition was started before.
	 * Will smoothly transition from previous to current.
	 * Will apply start state immediately.
	 */
	playTo(toValue: T): Promise<boolean> {
		if (this.fromValue === null) {
			throw new Error(`Must call "playBetween" firstly.`)
		}

		this.cancel()
		
		this.fromValue = this.currentValue
		this.toValue = toValue
		this.mixer = makeMixer(this.currentValue!, toValue)

		return this.startDeferredTransition()
	}

	/** 
	 * Start transition after delay milliseconds.
	 * Cancel old one if exist.
	 */
	private startDeferredTransition(): Promise<boolean> {
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
	 * Finish transition immediately,
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
	 * Note after cancelled, will not apply final state.
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
