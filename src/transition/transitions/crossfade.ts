import {untilUpdateComplete} from '../../observer'
import {PairKeysMap} from '../../structs'
import {DOMUtils, ObjectUtils} from '../../utils'
import {TransitionOptions, TransitionResult, Transition, WebTransitionProperties} from '../transition'


export interface CrossFadeTransitionOptions extends TransitionOptions {

	/** The key to match a pair of elements. */
	key: any

	/** If specified, select this element and use it's rect to do transition. */
	rectSelector?: string

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

	let oppositePhase: 'enter' | 'leave' = phase === 'enter' ? 'leave' : 'enter'
	let useAnyPair = false

	// Firstly try opposite phase, otherwise try any phase.
	let pairEl = CrossFadeElementMatchMap.get(options.key, oppositePhase)

	if (!pairEl) {
		pairEl = CrossFadeElementMatchMap.get(options.key, 'any')
		useAnyPair = true
	}

	// Delete key match after next-time update complete.
	untilUpdateComplete().then(() => {
		CrossFadeElementMatchMap.delete(options.key, phase)
	})

	// Fallback when there is no opposite element.
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
	let seBox = useRectOf === el ? elBox : useRectOf.getBoundingClientRect()
	
	// Transform box of current element to box of opposite element.
	let transform = transformMatrixFromBoxPair(seBox, prBox, elBox)

	let o: WebTransitionProperties = {
		startFrame: {
			transform: transform.toString(),
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
		let pTransform = transformMatrixFromBoxPair(prBox, seBox, prBox)
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


/** 
 * Make a transform matrix, which will convert `fromBox` to `toBox`.
 * Not use `Matrix` at `@pucelle/ff` because it imports additional `10kb` zipped codes.
 */
function transformMatrixFromBoxPair(fromBox: BoxLike, toBox: BoxLike, origin: Coord): DOMMatrix {
	let fromX = fromBox.x + fromBox.width / 2 - origin.x
	let fromY = fromBox.y + fromBox.height / 2 - origin.y
	let toX = toBox.x + toBox.width / 2 - origin.x
	let toY = toBox.y + toBox.height / 2 - origin.y

	// The DOMMatrix apply these transforms all in self-origin.
	// So they have the opposite order with `Matrix` at `@pucelle/ff`.
	let matrix = new DOMMatrix()
		.translateSelf(toX, toY)
		.scaleSelf(toBox.width / fromBox.width, toBox.height / fromBox.height)
		.translateSelf(-fromX, -fromY)

	return matrix
}