import {getCSSEasingValue, WebTransitionEasingName} from './easing'
import {PerFrameTransitionEvents, PerFrameTransitionOptions} from './per-frame-transition'
import {DocumentWatcher, EventFirer} from '../events'
import {promiseWithResolves} from '../utils'


/** 
 * Web Transition options, compare to `PerFrameTransitionOptions`,
 * some custom easing names have been excluded.
 */
export interface WebTransitionOptions extends PerFrameTransitionOptions {
	easing?: WebTransitionEasingName
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


	/** The element transition playing at. */
	readonly el: Element

	/** Options after fulfilled default values. */
	private readonly options: Required<WebTransitionOptions>

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
		this.options = {...DefaultWebTransitionOptions, ...options}
	}

	/** Whether transition is playing, or will run. */
	get running(): boolean {
		return !!this.animation && this.animation.playState === 'running'
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
	setFrom(startFrame: WebTransitionKeyFrame): this {
		this.cancel()
		this.startFrame = startFrame

		return this
	}

	/**
	 * Play from specified start frame to current state.
	 * Returns a promise which will be resolved after transition end.
	 * After transition ended, go back to initial state.
	 */
	playFrom(startFrame: WebTransitionKeyFrame): Promise<boolean> {
		let endFrame: WebTransitionKeyFrame = {}
		let style = getComputedStyle(this.el)

		for (let property of Object.keys(startFrame)) {
			(endFrame as any)[property] = (style as any)[property] || DefaultNotNumericStyleProperties[property] || '0'
		}

		this.startFrame = startFrame
		this.endFrame = endFrame

		return this.startPlaying()
	}

	/** 
	 * Play from current frame to target end frame.
	 * Returns a promise which will be resolved after transition end.
	 * 
	 * By default when `applyFinalState` is `false`, after transition ended, go back to initial state.
	 * If `applyFinalState` specified as `true`, will apply final state after transition end.
	 * 
	 * If haven't set start frame, use current state as start frame.
	 */
	async playTo(endFrame: WebTransitionKeyFrame, applyFinalState: boolean = false): Promise<boolean> {
		let startFrame = this.startFrame

		if (!startFrame) {
			startFrame = {}

			let style = getComputedStyle(this.el)

			for (let property of Object.keys(endFrame)) {
				(startFrame as any)[property] = (style as any)[property] || DefaultNotNumericStyleProperties[property] || '0'
			}
		}

		return this.playBetween(startFrame, endFrame, applyFinalState)
	}

	/** 
	 * Play between start and end frames.
	 * Returns a promise which will be resolved after transition end.
	 * 
	 * By default when `applyFinalState` is `false`, after transition ended, go back to initial state.
	 * If `applyFinalState` specified as `true`, will apply final state after transition end.
	 */
	async playBetween(startFrame: WebTransitionKeyFrame, endFrame: WebTransitionKeyFrame, applyFinalState: boolean = false): Promise<boolean> {
		this.cancel()
		
		this.startFrame = startFrame
		this.endFrame = endFrame

		let finish = await this.startPlaying()

		// Apply final state.
		if (applyFinalState) {
			for (let [property, value] of Object.entries(endFrame)) {
				(this.el as HTMLElement).style.setProperty(property, value as any)
			}
		}

		return finish
	}

	/** Start playing transition. */
	private async startPlaying(): Promise<boolean> {
		if (this.running) {
			this.fire('continued')
		}
		else {
			this.fire('started')
		}

		let easing = getCSSEasingValue(this.options.easing)
		let duration = this.options.duration
		let delay = this.options.delay

		this.animation = this.el.animate(
			[this.startFrame as any as Keyframe, this.endFrame as any as Keyframe],
			{
				easing,
				duration,
				delay
			}
		)

		let {promise, resolve} = promiseWithResolves<boolean>()
		
		this.promise = promise
		this.resolve = resolve

		this.animation.onfinish = () => {
			this.onFinished()
		}

		this.animation.oncancel = () => {
			this.onCanceled()
		}

		let finish = await promise
		if (finish) {
			this.startFrame = this.endFrame
			this.endFrame = null

			// No document mutation event fired, but need to check state.
			DocumentWatcher.trigger()
		}

		return finish
	}

	/** 
	 * Finish current transition immediately,
	 * and fallback to initial state.
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
	 * Note after cancelled, will fallback to initial state.
	 */
	cancel() {
		if (!this.animation) {
			return
		}

		this.animation.oncancel = null
		this.animation.cancel()
		this.onCanceled()
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
