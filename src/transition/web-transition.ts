import {WebAnimationEasingName} from './easing'
import {PerFrameTransitionEvents, PerFrameTransitionOptions} from './per-frame-transition'
import {EventFirer} from '../events'


/** 
 * Web Transition options, compare to `PerFrameTransitionOptions`,
 * some custom easing names have been excluded.
 */
export interface WebTransitionOptions extends PerFrameTransitionOptions {
	easing?: WebAnimationEasingName
}

/** Web Transition events. */
export type WebTransitionEvents = Omit<PerFrameTransitionEvents<any>, 'progress'>

/** Represent the start and end frame. */
export type WebTransitionKeyFrame = Partial<CSSStyleDeclaration>


const DefaultWebTransitionOptions: Required<WebTransitionOptions> = {
	duration: 200,
	easing: 'ease-out-quad',
	delay: 0,
}

/** The style property, which doesn't use `0` as default value. */
const DefaultNotNumericStyleProperties: Record<string, string> = {
	transform: 'none'
}


/** Uses web animations apis to play style transition. */
export class WebTransition extends EventFirer<WebTransitionEvents> {

	/** Default web transition options. */
	static DefaultOptions: Required<WebTransitionOptions> = DefaultWebTransitionOptions

	/** Play transition with configuration, and between start and end frame. */
	static playBetween(
		el: Element,
		startFrame: WebTransitionKeyFrame,
		endFrame: WebTransitionKeyFrame,
		duration: number = DefaultWebTransitionOptions.duration,
		easing: WebAnimationEasingName = DefaultWebTransitionOptions.easing as WebAnimationEasingName,
		delay: number = 0
	): Promise<boolean>
	{
		let transition = new WebTransition(el, {duration, easing, delay})
		return transition.playBetween(startFrame, endFrame)
	}

	/**
	 * Play web transition from specified start frame to current state.
	 * After transition ended, go back to initial state.
	 */
	static playFrom(
		el: Element,
		startFrame: WebTransitionKeyFrame,
		duration: number,
		easing: WebAnimationEasingName,
		delay: number = 0
	): Promise<boolean>
	{
		let endFrame: WebTransitionKeyFrame = {}
		let style = getComputedStyle(el)

		for (let property of Object.keys(startFrame)) {
			(endFrame as any)[property] = (style as any)[property] || DefaultNotNumericStyleProperties[property] || '0'
		}

		let transition = new WebTransition(el, {duration, easing, delay})
		return transition.playBetween(startFrame, endFrame)
	}

	/**
	 * Play web transition from current state to specified end frame.
	 * After transition ended, go back to initial state.
	 */
	static playTo(
		el: Element,
		endFrame: WebTransitionKeyFrame,
		duration: number,
		easing: WebAnimationEasingName,
		delay: number = 0
	): Promise<boolean>
	{
		let startFrame: WebTransitionKeyFrame = {}
		let style = getComputedStyle(el)

		for (let property of Object.keys(endFrame)) {
			(startFrame as any)[property] = (style as any)[property] || DefaultNotNumericStyleProperties[property] || '0'
		}

		let transition = new WebTransition(el, {duration, easing, delay})
		return transition.playBetween(startFrame, endFrame)
	}


	/** The element transition playing at. */
	readonly el: Element

	/** Options after fulfilled default values. */
	private readonly fullOptions: Required<WebTransitionOptions>

	/** Running animation. */
	private animation: Animation | null = null

	/** Transition promise. */
	private promise: Promise<boolean> | null = null

	/** 
	 * Be resolved after transition end.
	 * Resolve parameter is whether transition finished.
	 */
	private resolve: ((finished: boolean) => void) | null = null

	/** 
	 * Start frame.
	 * Readonly outside.
	 */
	startFrame: WebTransitionKeyFrame | null = null

	/** 
	 * End frame.
	 * Readonly outside.
	 */
	endFrame: WebTransitionKeyFrame | null = null

	constructor(el: Element, options: WebTransitionOptions = {}) {
		super()
		this.el = el
		this.fullOptions = {...DefaultWebTransitionOptions, ...options}
	}

	/** Whether transition is playing, or within delay period. */
	get running(): boolean {
		return !!this.animation
	}

	/** 
	 * Update transition options.
	 * Return whether any option has changed.
	 */
	assignOptions(options: Partial<PerFrameTransitionOptions> = {}): boolean {
		let changed = false

		for (let [key, value] of Object.entries(options) as Iterable<[keyof PerFrameTransitionOptions, any]>) {
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
	 * If is not playing, resolved by `true`, same as finish.
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
	 * Set start frame.
	 * Only cancel current transition and update start frames.
	 * Returns `this`.
	 */
	playFrom(startFrame: WebTransitionKeyFrame): this {
		this.cancel()
		this.startFrame = startFrame

		return this
	}

	/** 
	 * Play from current frame to target end frame.
	 * Returns a promise which will be resolved after transition end.
	 * After transition ended, go back to initial state.
	 * Work only when transition was started before.
	 */
	playTo(endFrame: WebTransitionKeyFrame): Promise<boolean> {
		if (this.startFrame === null) {
			throw new Error(`Must call "playFrom" or "playBetween" firstly!`)
		}

		this.endFrame = endFrame

		return this.startPlaying()
	}

	/** 
	 * Play between start and end frames.
	 * Returns a promise which will be resolved after transition end.
	 * After transition ended, go back to initial state.
	 */
	playBetween(startFrame: WebTransitionKeyFrame, endFrame: WebTransitionKeyFrame): Promise<boolean> {
		this.cancel()
		
		this.startFrame = startFrame
		this.endFrame = endFrame

		return this.startPlaying()
	}

	/** Start playing transition. */
	private startPlaying(): Promise<boolean> {
		if (this.running) {
			this.fire('continued')
		}
		else {
			this.fire('started')
		}

		this.animation = this.el.animate(
			[this.startFrame as any as Keyframe, this.endFrame as any as Keyframe],
			this.fullOptions
		)

		this.promise = new Promise((resolve) => {
			this.resolve = resolve

			this.animation!.addEventListener('finish', () => {
				this.onFinished()
			}, false)

			this.animation!.addEventListener('cancel', () => {
				this.onCanceled()
			}, false)
		}) as Promise<boolean>

		return this.promise
	}

	/** 
	 * Finish current transition immediately,
	 * and apply final state.
	 */
	finish() {
		if (!this.animation) {
			return
		}

		this.animation.finish()
	}

	private onFinished() {
		this.fire('finished')
		this.end(true)
	}
	
	/** 
	 * Cancel current transition if is playing.
	 * Note after cancelled, will keep it's current state, but not apply final state.
	 */
	cancel() {
		if (!this.animation) {
			return
		}

		this.animation.cancel()
	}

	private onCanceled() {
		this.fire('cancelled')
		this.end(false)
	}

	/** End, either finish or cancel. */
	private end(finish: boolean) {
		this.animation = null
		this.promise = null

		if (this.resolve) {
			this.resolve(finish)
			this.resolve = null
		}

		this.fire('ended', finish)
	}
}
