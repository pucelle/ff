import {WebAnimationEasingName} from './easing'
import {TransitionEvents, TransitionOptions} from './transition-frame'
import {EventFirer} from '../event-firer'


/** CSS Transition options. */
export interface CSSTransitionOptions extends TransitionOptions {
	easing: WebAnimationEasingName
}

/** CSS Transition events. */
export type CSSTransitionEvents = Omit<TransitionEvents<any>, 'progress'>


/** Numeric style property names than can apply transition to. */
export type TransitionableProperty = 'width' |
	'height' |
	'opacity' |
	'margin' |
	'marginLeft' |
	'marginRght' |
	'marginTop' |
	'marginBottom' |
	'padding' |
	'paddingLeft' |
	'paddingRght' |
	'paddingTop' |
	'paddingBottom' |
	'borderWidth' |
	'borderLeftWidth' |
	'borderRightWidth' |
	'borderTopWidth' |
	'borderBottomWidth' |
	'transform'


const DefaultCSSTransitionOptions: CSSTransitionOptions = {
	duration: 200,
	easing: 'ease-out-quad',
	delay: 0,
}

/** The style property, which doesn't use `0` as default value. */
const DefaultNotNumericProperties: Record<string, string> = {
	transform: 'none'
}


/** Uses web animations apis to play css transition. */
export class CSSTransition extends EventFirer<CSSTransitionEvents> {
	
	/** Play transition with configuration, and between start and end frame. */
	static playBetween(
		el: Element,
		startFrame: Keyframe,
		endFrame: Keyframe,
		duration: number = DefaultCSSTransitionOptions.duration,
		easing: WebAnimationEasingName = DefaultCSSTransitionOptions.easing as WebAnimationEasingName,
		delay: number = 0
	): Promise<boolean>
	{
		let transition = new CSSTransition(el, {duration, easing, delay})
		return transition.playBetween(startFrame, endFrame)
	}

	/**
	 * Play css transition from specified start frame to current state.
	 * After transition ended, go back to initial state.
	 */
	static playFrom(
		el: Element,
		startFrame: Keyframe,
		duration: number,
		easing: WebAnimationEasingName,
		delay: number = 0
	): Promise<boolean>
	{
		let endFrame: Keyframe = {}
		let style = getComputedStyle(el)

		for (let property of Object.keys(startFrame)) {
			endFrame[property] = (style as any)[property] || DefaultNotNumericProperties[property] || '0'
		}

		let transition = new CSSTransition(el, {duration, easing, delay})
		return transition.playBetween(startFrame, endFrame)
	}

	/**
	 * Play css transition from current state to specified end frame.
	 * After transition ended, go back to initial state.
	 */
	static playTo(
		el: Element,
		endFrame: Keyframe,
		duration: number,
		easing: WebAnimationEasingName,
		delay: number = 0
	): Promise<boolean>
	{
		let startFrame: Keyframe = {}
		let style = getComputedStyle(el)

		for (let property of Object.keys(endFrame)) {
			startFrame[property] = (style as any)[property] || DefaultNotNumericProperties[property] || '0'
		}

		let transition = new CSSTransition(el, {duration, easing, delay})
		return transition.playBetween(startFrame, endFrame)
	}


	/** The element transition playing at. */
	readonly el: Element

	/** Options after fullfilled default values. */
	private readonly fullOptions: CSSTransitionOptions

	/** Transition promise. */
	private promise: Promise<boolean> | null = null

	/** 
	 * Be resolved after transition end.
	 * Resolve paramter is whether transition finished.
	 */
	private resolve: ((finished: boolean) => void) | null = null

	/** 
	 * Start frame.
	 * Readonly outside.
	 */
	startFrame: Keyframe | null = null

	/** 
	 * End frame.
	 * Readonly outside.
	 */
	endFrame: Keyframe | null = null

	constructor(el: Element, options: Partial<CSSTransitionOptions> = {}) {
		super()
		this.el = el
		this.fullOptions = {...DefaultCSSTransitionOptions, ...options}
	}

	/** Whether transition is playing, or within delay period. */
	get running(): boolean {
		return !!this.promise
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
	 * Set start frame.
	 * Only cancel current transition and update start frames.
	 * Returns `this`.
	 */
	playFrom(startFrame: Keyframe): this {
		this.cancel()
		this.startFrame = startFrame

		return this
	}

	/** 
	 * Play from current frame to new end frame.
	 * Returns a promise which will be resolved after transition end.
	 * After transition ended, go back to initial state.
	 * Work only when transition was started before.
	 */
	playTo(endFrame: Keyframe): Promise<boolean> {
		if (this.startFrame === null) {
			throw new Error(`Must call "playFrom" or "playBetween" firstly!`)
		}

		this.endFrame = endFrame

		return this.startPlaying()
	}

	/** 
	 * Play between from and to values.
	 * Returns a promise which will be resolved after transition end.
	 * After transition ended, go back to initial state.
	 */
	playBetween(startFrame: Keyframe, endFrame: Keyframe): Promise<boolean> {
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

		let animation = this.el.animate([this.startFrame!, this.endFrame!], {
			easing: this.fullOptions.easing,
			duration: this.fullOptions.duration,
			delay: this.fullOptions.delay,
		})

		this.promise = new Promise((resolve) => {
			this.resolve = resolve

			animation.addEventListener('finish', () => {
				this.finish()
			}, false)

			animation.addEventListener('cancel', () => {
				this.cancel()
			}, false)
		}) as Promise<boolean>

		return this.promise
	}

	/** 
	 * Finish current transition immediately,
	 * and apply final state.
	 */
	finish() {
		if (!this.running) {
			return
		}

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
		this.promise = null

		if (this.resolve) {
			this.resolve(finish)
			this.resolve = null
		}

		this.fire('ended', finish)
	}
}
