import {DeepReadonly} from '../observable'
import {ObjectUtils} from '../utils'
import {PerFrameTransition, PerFrameTransitionOptions} from './per-frame-transition'
import {WebTransition, WebTransitionKeyFrame, WebTransitionOptions} from './web-transition'


/** 
 * Base transition options for `Transition`.
 * Note some easing name like `ease-in-elastic` is not available for web type transition.
 */
export interface TransitionOptions extends PerFrameTransitionOptions {
	
	/** 
	 * Specifies transition phase.
	 * E.g., if specifies to `enter` and need to play leave transition, nothing happens.
	 * Default value is `both`.
	 */
	phase?: TransitionPhase
}

/** 
 * Transition phase limit, includes enter and leave part.
 * Only phase is allowed the transition can play.
 */
export type TransitionPhase = 'enter' | 'leave' | 'both' | 'none'


export interface WebTransitionProperties extends PerFrameTransitionOptions {

	/** 
	 * Start frame, specifies the start state of enter or end state of leave.
	 * It's normally a "zero" state.
	 */
	startFrame: WebTransitionKeyFrame

	/** 
	 * End frame, specifies the end state of enter or start state of leave.
	 * It's normally a "100%" state.
	 */
	endFrame: WebTransitionKeyFrame
}

export interface PerFrameTransitionProperties extends PerFrameTransitionOptions {

	/**
	 * Process somethings per frame.
	 * `progress` betweens `0~1`.
	 */
	perFrame: (progress: number) => void
}

/** 
 * Transition properties to decide how to run the transition,
 * A defined transition getter should return this.
 * It's decided by target element and options for this transition getter.
 */
export type TransitionProperties = WebTransitionProperties | PerFrameTransitionProperties

/** 
 * A transition getter,
 * it accepts target element and options for this transition getter,
 * and return transition properties.
 * 
 * Can either return a transition properties, null, or a promise resolved by these.
 * 
 * Normally you should choose returning `startFrame` and `endFrame` to use web transition.
 */
export type TransitionPropertiesGetter<E extends Element, O extends TransitionOptions | undefined>
	= (el: E, options: O, phase: 'enter' | 'leave') => TransitionProperties | null | Promise<TransitionProperties | null>

/** 
 * Calls `Transition.define` returned.
 * Give it to a `new Transition` can play it.
 */
export type DefinedTransition<E extends Element = Element, O extends TransitionOptions = TransitionOptions>
	= (options?: O) => TransitionResult<E, O>


/**
 * Intermediate class generate from instantiating a defined transition.
 * It caches options for later playing.
 */
export class TransitionResult<E extends Element = Element, O extends TransitionOptions = any>{

	readonly getter: TransitionPropertiesGetter<E, O>
	readonly options: DeepReadonly<O>

	constructor(getter: TransitionPropertiesGetter<E, O>, options: O = {} as any) {
		this.getter = getter
		this.options = options as DeepReadonly<O>
	}
}


/** Mixed transition type, enum of two, either web or per-frame. */
enum MixedTransitionType {
	PerFrame,
	Web,
}


/**
 * `Transition` can play transition according to a defined transition,
 * with some transition options.
 * 
 * `Transition` will dispatch 4 events on target element:
 * - `transition-enter-started`: After enter transition started.
 * - `transition-enter-ended`: After enter transition ended.
 * - `transition-leave-started`: After leave transition started.
 * - `transition-leave-ended`: After leave transition ended.
 */
export class Transition {

	/** 
	 * Define a transition, it accepts a transition getter,
	 * which make a transition properties object from target element and some options.
	 * And output a function which returns an object to cache this getter and captured options.
	 * 
	 * Note uses `defineTransition` cause executing codes in top level,
	 * so you may need to set `sideEffects: false` to make tree shaking work as expected.
	 */
	static define<E extends Element, O extends TransitionOptions>(
		getter: TransitionPropertiesGetter<E, O>
	): (options?: O) => TransitionResult<E, O>
	{
		return function(options: O | undefined) {
			return new TransitionResult(getter, options)
		}
	}


	private readonly el: Element
	private result: TransitionResult | null = null
	private mixedTransitionType: MixedTransitionType | null = null
	private mixedTransition: PerFrameTransition | WebTransition | null = null

	constructor(el: Element) {
		this.el = el
	}

	update(result: TransitionResult | null) {
		this.result = result

		// Cancel transition immediately if transition value becomes `null`.
		if (!this.result) {
			this.clearTransition()
		}
	}

	private clearTransition() {
		this.mixedTransitionType = null

		if (this.mixedTransition) {
			this.mixedTransition.cancel()
			this.mixedTransition = null
		}
	}

	/** 
	 * Play enter transition.
	 * e.g., `enter(fade({duration: 1000, easing: 'linear}))`.
	 * Returns true if transition finished, false if canceled, null if prevented.
	 */
	async enter(result: TransitionResult): Promise<boolean | null> {
		let {phase} = result.options as DeepReadonly<TransitionOptions>
		if (phase === 'leave' || phase === 'none') {
			return null
		}

		let props = await result.getter(this.el, result.options, 'enter')
		if (!props) {
			return null
		}
		
		this.updateTransition(props)

		let enterStartedEvent = new CustomEvent('transition-enter-started')
		this.el.dispatchEvent(enterStartedEvent)

		let finish: boolean

		if (this.mixedTransitionType === MixedTransitionType.PerFrame) {
			let perFrame = (props as PerFrameTransitionProperties).perFrame
			finish = await (this.mixedTransition as PerFrameTransition).playBetween(0, 1, perFrame)
		}
		else {
			let startFrame = (props as WebTransitionProperties).startFrame;
			let endFrame = (props as WebTransitionProperties).endFrame;
			finish = await (this.mixedTransition as WebTransition).playBetween(startFrame, endFrame)
		}

		if (finish) {
			let enterEndedEvent = new CustomEvent('transition-enter-ended')
			this.el.dispatchEvent(enterEndedEvent)
		}

		return finish
	}

	/** 
	 * Play leave transition.
	 * e.g., `leave(fade({duration: 1000, easing: 'linear}))`.
	 * Returns true if transition finished, false if canceled, null if prevented.
	 */
	async leave(result: TransitionResult): Promise<boolean | null> {
		let {phase} = result.options as DeepReadonly<TransitionOptions>
		if (phase === 'enter' || phase === 'none') {
			return null
		}

		let props = await result.getter(this.el, result.options, 'leave')
		if (!props) {
			return null
		}

		this.updateTransition(props)

		let leaveStartedEvent = new CustomEvent('transition-leave-started')
		this.el.dispatchEvent(leaveStartedEvent)

		let finish: boolean

		if (this.mixedTransitionType === MixedTransitionType.PerFrame) {
			let perFrame = (props as PerFrameTransitionProperties).perFrame;
			finish = await (this.mixedTransition as PerFrameTransition).playBetween(1, 0, perFrame);
		}
		else {
			let startFrame = (props as WebTransitionProperties).startFrame;
			let endFrame = (props as WebTransitionProperties).endFrame;
			finish = await (this.mixedTransition as WebTransition).playBetween(endFrame, startFrame)
		}

		if (finish) {
			let leaveEndedEvent = new CustomEvent('transition-leave-ended')
			this.el.dispatchEvent(leaveEndedEvent)
		}

		return finish
	}

	private updateTransition(props: TransitionProperties) {
		let type = this.getTransitionType(props)

		if (this.mixedTransitionType !== type) {
			if (this.mixedTransition) {
				this.mixedTransition.finish()
			}

			this.mixedTransition = null
			this.mixedTransitionType = type
		}

		if (!this.mixedTransition) {
			let options = ObjectUtils.cleanEmptyValues({
				duration: props.duration,
				easing: props.easing,
				delay: props.delay,
			})

			if (type === MixedTransitionType.PerFrame) {
				this.mixedTransition = new PerFrameTransition(options)
			}
			else {
				this.mixedTransition = new WebTransition(this.el, options as WebTransitionOptions)
			}
		}
	}

	private getTransitionType(props: TransitionProperties): MixedTransitionType {
		if ((props as PerFrameTransitionProperties).perFrame) {
			return MixedTransitionType.PerFrame
		}
		else {
			return MixedTransitionType.Web
		}
	}

	/** 
	 * Finish current transition immediately,
	 * for per-frame transition, will apply final state,
	 * for web transition, will fallback to initial state,
	 */
	finish() {
		this.mixedTransition?.finish()
	}
	
	/** 
	 * Cancel current transition if is playing.
	 * Note after cancelled,
	 * for per-frame transition, will persist current state,
	 * for web transition, will fallback to initial state,
	 * Both of them will not apply final state.
	 */
	cancel() {
		this.mixedTransition?.cancel()
	}
}
