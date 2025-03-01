import {Matrix} from '../../math'
import {untilUpdateComplete} from '../../observer'
import {PairKeysMap} from '../../structs'
import {DOMUtils, ObjectUtils} from '../../utils'
import {TransitionOptions, TransitionResult, Transition, WebTransitionProperties} from '../transition'


export interface CrossFadeTransitionOptions extends TransitionOptions {

	/** The key to match a pair of elements. */
	key: any

	/** If specified, select this element and use it's rect to do transition. */
	rectSelector?: string

	/** 
	 * How to fit transition element with it's pair element.
	 *  - `contain`: be contained by pair element.
	 *  - `cover`: covers pair element.
	 *  - `stretch`: stretch to fit pair element's width and height.
	 * Default value is `stretch`.
	 */
	fitMode?: 'contain' | 'cover' | 'stretch'

	/** Whether also play fade transition. */
	fade?: boolean

	/** 
	 * Define the fallback transition when no matched element.
	 * E.g., `{fallback: fade()}`.
	 * By default no fallback defined, no transition will be played.
	 */
	fallback?: TransitionResult
}


/** Cache "Crossfade Key" -> "enter / leave" -> Element. */
const CrossFadeElementMatchMap: PairKeysMap<any, 'enter' | 'leave' | 'any', Element> = new PairKeysMap()


/** 
 * Set element for crossfade transition.
 * It will provide the mapped element rect for later connected `crossfade` transition,
 * but itself will not play transition.
 */
export function setCrossFadeElementForPairOnly(key: any, el: Element) {
	CrossFadeElementMatchMap.set(key, 'any', el)
}

/** Delete element previously set by `setCrossFadeElementForPairOnly` for crossfade transition. */
export function deleteCrossFadeElementForPairOnly(key: any, el: Element) {
	if (CrossFadeElementMatchMap.get(key, 'any') === el) {
		CrossFadeElementMatchMap.delete(key, 'any')
	}
}


/** 
 * When enter, transform from the leave element to current state.
 * When leave, transform from current state to the leave element.
 * So you can see one element cross fade to another element.
 * Use Web Animations API, fallback to initial state after transition end.
 */
export const crossfade = Transition.define(async function(el: Element, options: CrossFadeTransitionOptions, phase: 'enter' | 'leave') {
	CrossFadeElementMatchMap.set(options.key, phase, el)

	// Sync same keyed enter and leave transitions.
	await untilUpdateComplete()

	let pairPhase: 'enter' | 'leave' = phase === 'enter' ? 'leave' : 'enter'
	let useAnyPair = false

	// Firstly try pair phase, otherwise try any phase.
	let pairEl = CrossFadeElementMatchMap.get(options.key, pairPhase)

	if (!pairEl) {
		pairEl = CrossFadeElementMatchMap.get(options.key, 'any')
		useAnyPair = true
	}

	// Delete key match after next-time update complete.
	untilUpdateComplete().then(() => {
		CrossFadeElementMatchMap.delete(options.key, phase)
	})

	// Fallback when there is no pair element.
	if (!pairEl) {
		let fallback = options.fallback
		if (!fallback) {
			return null
		}

		return fallback.getter(el, fallback.options, phase)
	}

	let useRectOf = options.rectSelector ? el.querySelector(options.rectSelector) ?? el : el
	let prBox = pairEl.getBoundingClientRect()
	let elBox = el.getBoundingClientRect()
	let roBox = useRectOf === el ? elBox : useRectOf.getBoundingClientRect()
	
	// Transform coord from el origin to pair element origin, based on viewport origin.
	let transformInViewport = Matrix.fromBoxPair(roBox, prBox, options.fitMode ?? 'stretch')

	// TransformInViewport * elLocalToViewport = elLocalToViewport * TransformInEl
	// TransformInEl = elLocalToViewport^-1 * TransformInViewport * elLocalToViewport
	let transformInElOrigin = Matrix.i()
		.translateSelf(elBox.x, elBox.y)
		.preMultiplySelf(transformInViewport)
		.translateSelf(-elBox.x, -elBox.y)

	let o: WebTransitionProperties = {
		startFrame: {
			transform: transformInElOrigin.toString(),
			transformOrigin: 'left top',
		},
		endFrame: {
			transform: 'none',
			transformOrigin: 'left top',
		},
	}

	if (options.fade) {
		o.startFrame.opacity = '0'
		o.endFrame.opacity = '1'
	}

	o = ObjectUtils.assignWithoutKeys(o, options, ['key', 'fallback'])

	if (phase === 'leave') {
		CrossFadeElementMatchMap.delete(options.key, phase)
	}

	// Play transitions for both el and pair element.
	if (useAnyPair) {

		// PairTransformInPair will transform pair element to el, based on top-left or pair element.
		// PairTransformInViewport = TransformInViewport^-1
		// PairTransformInViewport * pairLocalToViewport = pairLocalToViewport * PairTransformInPair
		// PairTransformInPair = pairLocalToViewport^-1 * PairTransformInViewport * pairLocalToViewport
		//                     = pairLocalToViewport^-1 * TransformInViewport^-1 * pairLocalToViewport
		let pTransform = Matrix.i()
			.translateSelf(prBox.x, prBox.y)
			.preMultiplySelf(transformInViewport.invertSelf())
			.translateSelf(-prBox.x, -prBox.y)

		let zIndex = parseInt(DOMUtils.getStyleValue(pairEl, 'zIndex')) || 0

		let po: WebTransitionProperties = {
			el: pairEl,
			startFrame: {
				transform: 'none',
				transformOrigin: 'left top',
				zIndex: String(zIndex + 1),	// Higher than siblings.
			},
			endFrame: {
				transform: pTransform.toString(),
				transformOrigin: 'left top',
				zIndex: String(zIndex + 1),
			},
		}

		if (options.fade) {
			po.startFrame.opacity = '1'
			po.endFrame.opacity = '0'
		}
	
		po = ObjectUtils.assignWithoutKeys(po, options, ['key', 'fallback'])

		return [o, po]
	}
	else {
		return o
	}
})