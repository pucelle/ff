import {DeepReadonly, untilUpdateComplete} from '../observer'
import {ObjectUtils, promiseWithResolves} from '../utils'
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
	 * Specifies the element to play transition.
	 * If omit, use current element.
	 */
	el?: Element

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
export type TransitionProperties = WebTransitionProperties
	| PerFrameTransitionProperties
	| WebTransitionProperties[]

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

/** Web or Per Frame Transition. */
interface MixedTransition {
	type: MixedTransitionType
	transition: PerFrameTransition | WebTransition
	props: PerFrameTransitionProperties | WebTransitionProperties
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
	private version = 0
	private result: TransitionResult | null = null
	private mixedTransitions: MixedTransition[] = []

	/** Whether ready to play transition. */
	private ready: Promise<void> | null = null

	constructor(el: Element) {
		this.el = el
	}

	/** Whether transition is playing, or will run. */
	get running(): boolean {
		return !!this.ready || this.mixedTransitions.some(t => t.transition.running)
	}

	/** Update by new transition result like `fade()`. */
	update(result: TransitionResult | null) {
		this.result = result

		// Cancel transition immediately if transition value becomes `null`.
		if (!this.result) {
			this.clearTransitions()
		}
	}

	private clearTransitions() {
		for (let t of this.mixedTransitions) {
			t.transition.cancel()
		}

		this.mixedTransitions = []
	}

	/** 
	 * Play enter transition.
	 * e.g., `enter(fade({duration: 1000, easing: 'linear}))`.
	 * Returns true if transition finished, false if canceled or prevented.
	 * It will wait for update complete then reading dom properties.
	 */
	async enter(result: TransitionResult): Promise<boolean> {
		let {phase} = result.options as DeepReadonly<TransitionOptions>
		if (phase === 'leave' || phase === 'none') {
			return false
		}

		if (!await this.prepareTransitions('enter', result)) {
			return false
		}

		let enterStartedEvent = new CustomEvent('transition-enter-started')
		this.el.dispatchEvent(enterStartedEvent)

		let promises: Promise<boolean>[] = []

		for (let mixed of this.mixedTransitions) {
			promises.push(this.playMixedTransition(mixed, 'enter'))
		}

		let finished = (await Promise.all(promises)).every(v => v)
		if (finished) {
			let enterEndedEvent = new CustomEvent('transition-enter-ended')
			this.el.dispatchEvent(enterEndedEvent)
		}

		return finished
	}

	/** 
	 * Play leave transition.
	 * e.g., `leave(fade({duration: 1000, easing: 'linear}))`.
	 * Returns true if transition finished, false if canceled or prevented.
	 * It will wait for update complete then reading dom properties.
	 */
	async leave(result: TransitionResult): Promise<boolean> {
		let {phase} = result.options as DeepReadonly<TransitionOptions>
		if (phase === 'enter' || phase === 'none') {
			return false
		}

		if (!await this.prepareTransitions('leave', result)) {
			return false
		}

		let leaveStartedEvent = new CustomEvent('transition-leave-started')
		this.el.dispatchEvent(leaveStartedEvent)

		let promises: Promise<boolean>[] = []

		for (let mixed of this.mixedTransitions) {
			promises.push(this.playMixedTransition(mixed, 'leave'))
		}

		let finished = (await Promise.all(promises)).every(v => v)
		if (finished) {
			let leaveEndedEvent = new CustomEvent('transition-leave-ended')
			this.el.dispatchEvent(leaveEndedEvent)
		}

		return finished
	}

	/** Prepare for transition properties, and update mixed transition players. */
	private async prepareTransitions(phase: 'enter' | 'leave', result: TransitionResult): Promise<boolean> {
		let version = ++this.version
		let {promise, resolve} = promiseWithResolves()

		this.ready = promise.then(() => {
			this.ready = null
		})

		// Most transition getters will read dom properties.
		// Ensure it firstly render, then play.
		await untilUpdateComplete()

		// May start to play another.
		if (this.version !== version) {
			resolve()
			return false
		}

		let props = await result.getter(this.el, result.options, phase)

		// All async things completed.
		resolve()

		if (!props) {
			return false
		}

		if (this.version !== version) {
			return false
		}

		let propsArray = Array.isArray(props) ? props : [props]
		this.updateMixedTransitions(propsArray)

		return true
	}

	/** Update for transition players. */
	private updateMixedTransitions(propsArray: (PerFrameTransitionProperties | WebTransitionProperties)[]) {

		// Cancel old transitions.
		for (let t of this.mixedTransitions) {
			t.transition.cancel()
		}

		for (let i = 0; i < propsArray.length; i++) {
			let props = propsArray[i]
			let type = this.getTransitionType(props)

			if (this.mixedTransitions.length < i + 1
				|| !this.isExistingMixedTransitionMatch(this.mixedTransitions[i], type, props)
			) {
				let transition: PerFrameTransition | WebTransition

				// Options exclude transition properties, keeps only these.
				let options = ObjectUtils.cleanEmptyValues({
					duration: props.duration,
					easing: props.easing,
					delay: props.delay,
				})

				if (type === MixedTransitionType.PerFrame) {
					transition = new PerFrameTransition(options)
				}
				else {
					let el = (props as WebTransitionProperties).el ?? this.el
					transition = new WebTransition(el, options as WebTransitionOptions)
				}

				this.mixedTransitions[i] = {type, transition, props}
			}
		}

		if (this.mixedTransitions.length > propsArray.length) {
			this.mixedTransitions = this.mixedTransitions.slice(0, propsArray.length)
		}
	}

	/** Get transition type by transition properties. */
	private getTransitionType(props: TransitionProperties): MixedTransitionType {
		if ((props as PerFrameTransitionProperties).perFrame) {
			return MixedTransitionType.PerFrame
		}
		else {
			return MixedTransitionType.Web
		}
	}

	/** Test whether existing mixed transition still match with newly type and props. */
	private isExistingMixedTransitionMatch(mixed: MixedTransition, type: MixedTransitionType, props: TransitionProperties): boolean {
		if (type !== mixed.type) {
			return false
		}

		if (type == MixedTransitionType.Web) {
			let transition = mixed.transition as WebTransition
			let el = (props as WebTransitionProperties).el ?? this.el

			if (transition.el !== el) {
				return false
			}
		}

		return true
	}

	/** Play each mixed transition. */
	private playMixedTransition(mixed: MixedTransition, phase: 'enter' | 'leave'): Promise<boolean> {
		if (mixed.type === MixedTransitionType.PerFrame) {
			let perFrame = (mixed.props as PerFrameTransitionProperties).perFrame
			let transition = mixed.transition as PerFrameTransition

			if (phase === 'enter') {
				return transition.playBetween(0, 1, perFrame)
			}
			else {
				return transition.playBetween(1, 0, perFrame)
			}
		}
		else {
			let startFrame = (mixed.props as WebTransitionProperties).startFrame
			let endFrame = (mixed.props as WebTransitionProperties).endFrame
			let transition = mixed.transition as WebTransition

			if (phase === 'enter') {
				return transition.playBetween(startFrame, endFrame)
			}
			else {
				return transition.playBetween(endFrame, startFrame)
			}
		}
	}

	/** 
	 * Finish current transition immediately,
	 * for per-frame transition, will apply final state,
	 * for web transition, will fallback to initial state,
	 */
	async finish() {
		if (this.ready) {
			await this.ready
		}
		
		for (let {transition} of this.mixedTransitions) {
			transition.finish()
		}
	}
	
	/** 
	 * Cancel current transition if is playing.
	 * Note after cancelled,
	 * for per-frame transition, will persist current state,
	 * for web transition, will fallback to initial state,
	 * Both of them will not apply final state.
	 */
	cancel() {
		for (let {transition} of this.mixedTransitions) {
			transition.cancel()
		}

		this.version++
	}
}
