import {EasingFunction, PerFrameTransitionEasingName, getEasingFunction} from './easing'
import {MathUtils} from '../math'
import {makeMixer} from './mixer'
import {EventFirer, promiseWithResolves} from '@pucelle/lupos'
import {FrameLoop, Timeout} from '../utils'


/** Transition events. */
export interface PerFrameTransitionEvents<T> {

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
export interface PerFrameTransitionOptions {

	/** 
	 * Specifies default transition duration in milliseconds.
	 * Default value is `200`.
	 */
	duration?: number

	/** 
	 * Specifies default transition easing type.
	 * Default value is `ease-out-quad`.
	 */
	easing?: PerFrameTransitionEasingName

	/** Transition delay in milliseconds. */
	delay?: number
}


const DefaultPerFrameTransitionOptions: Required<PerFrameTransitionOptions> = {
	duration: 200,
	easing: 'ease-out-quad',
	delay: 0,
}


/** Transition between start and end values per frame. */
export class PerFrameTransition<T extends TransitionAbleValue = any> extends EventFirer<PerFrameTransitionEvents<T>> {

	/** Default transition options. */
	static DefaultOptions: Required<PerFrameTransitionOptions> = DefaultPerFrameTransitionOptions


	/** Calculated easing function. */
	private easingFn: EasingFunction | null = null

	/** Options after fulfilled default values. */
	private options: Required<PerFrameTransitionOptions>

	/** Timeout when transition delay exist. */
	private delayTimeout: Timeout

	/** Animation frame loop. */
	private frameLoop: FrameLoop

	/** Transition promise. */
	private promise: Promise<boolean> | null = null

	/** 
	 * Be resolved after transition end.
	 * Resolve parameter is whether transition finished.
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

	/** A replaceable onprogress handler. */
	onprogress: ((value: T, progress: number) => void) | null = null

	/** 
	 * Current transition progress, betweens `0~1`,
	 * before easing mapped.
	 * Readonly outside.
	 */
	progress: number = 0

	constructor(options: PerFrameTransitionOptions = {}) {
		super()
		this.options = {...DefaultPerFrameTransitionOptions, ...options}
		this.delayTimeout = new Timeout(this.startTransition.bind(this), this.options.delay)
		this.frameLoop = new FrameLoop(this.onFrameLoop.bind(this))
		this.easingFn = getEasingFunction(this.options.easing)
	}

	/** Whether transition is playing, or will run. */
	get running(): boolean {
		return !!this.promise
	}

	/** 
	 * Update transition options.
	 * Return whether any option has changed.
	 */
	assignOptions(options: Partial<PerFrameTransitionOptions> = {}): boolean {
		let changed = false

		for (let [key, value] of Object.entries(options) as Iterable<[keyof PerFrameTransitionOptions, any]>) {
			if (this.options[key] !== value) {
				(this.options as any)[key] = value as any
				changed = true
			}
		}

		if (changed) {
			this.easingFn = getEasingFunction(this.options.easing)
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
	setFrom(startValue: T): this {
		this.cancel()
		this.startValue = startValue
		this.currentValue = startValue

		return this
	}

	/** 
	 * Play from start value to current value.
	 * Returns a promise which will be resolved after transition end.
	 * Work only when current value has been set before.
	 * After transition ended, will persist current state.
	 */
	playFrom(startValue: T, onprogress: ((value: T, progress: number) => void) | null = null): Promise<boolean> {
		if (this.currentValue === null) {
			throw new Error(`Must call "setFrom" or "playBetween" firstly!`)
		}

		this.cancel()
		
		this.startValue = startValue
		this.endValue = this.currentValue
		this.mixer = makeMixer(this.startValue, this.endValue)
		this.onprogress = onprogress

		return this.startDeferred()
	}

	/** 
	 * Play from current value to end value.
	 * Returns a promise which will be resolved after transition end.
	 * Work only when start value has been set before.
	 * After transition ended, will persist current state.
	 */
	playTo(endValue: T, onprogress: ((value: T, progress: number) => void) | null = null): Promise<boolean> {
		if (this.currentValue === null) {
			throw new Error(`Must call "playFrom" or "playBetween" firstly!`)
		}

		this.cancel()
		
		this.startValue = this.currentValue
		this.endValue = endValue
		this.mixer = makeMixer(this.startValue, this.endValue)
		this.onprogress = onprogress

		return this.startDeferred()
	}

	/** 
	 * Play between from and to values.
	 * Returns a promise which will be resolved after transition end.
	 * After transition end, will persist end state.
	 */
	playBetween(startValue: T, endValue: T, onprogress: ((value: T, progress: number) => void) | null = null): Promise<boolean> {
		this.cancel()
		
		this.startValue = startValue
		this.endValue = endValue
		this.currentValue = startValue
		this.mixer = makeMixer(startValue, endValue)
		this.onprogress = onprogress

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

		let {promise, resolve} = promiseWithResolves<boolean>()

		this.promise = promise
		this.resolve = resolve
		this.delayTimeout.start()

		return promise
	}

	/** Start new transition immediately. */
	private startTransition() {
		this.frameLoop.start()
	}

	/** On each animation frame. */
	private onFrameLoop(duration: number) {
		let x = MathUtils.linearStep(duration, 0, this.options.duration)
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

		if (this.onprogress) {
			this.onprogress(this.currentValue, x)
		}

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
	 * Note after cancelled, will persist current state, not apply final state.
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
