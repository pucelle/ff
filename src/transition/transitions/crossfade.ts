import {untilUpdateComplete} from '../../observer'
import {PairKeysMap} from '../../structs'
import {ObjectUtils} from '../../utils'
import {TransitionOptions, TransitionProperties, TransitionResult, Transition} from '../transition'


export interface CrossFadeTransitionOptions extends TransitionOptions {

	/** The key to match a pair of elements. */
	key: any

	/** If specified, select this element and use it's rect to do transition. */
	rectSelector?: string

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

	// Firstly try opposite phase, otherwise try any phase.
	let oppositeEl = CrossFadeElementMatchMap.get(options.key, oppositePhase)
		?? CrossFadeElementMatchMap.get(options.key, 'any')

	// Delete key match after next-time update complete.
	untilUpdateComplete().then(() => {
		CrossFadeElementMatchMap.delete(options.key, phase)
	})

	// Fallback when there is no opposite element.
	if (!oppositeEl) {
		let fallback = options.fallback
		if (!fallback) {
			return null
		}

		return fallback.getter(el, fallback.options, phase)
	}

	let useRectOf = options.rectSelector ? el.querySelector(options.rectSelector) ?? el : el
	let opBox = oppositeEl.getBoundingClientRect()
	let elBox = el.getBoundingClientRect()
	let reBox = useRectOf === el ? elBox : useRectOf.getBoundingClientRect()

	// Transform box of current element to box of opposite element.
	let transform = transformMatrixFromBoxPair(reBox, opBox, elBox)

	let o: TransitionProperties = {
		startFrame: {
			transform: transform.toString(),
			transformOrigin: 'left top',
			opacity: '0',
		},
		endFrame: {
			transform: 'none',
			transformOrigin: 'left top',
			opacity: '1',
		},
	}

	if (phase === 'leave') {
		CrossFadeElementMatchMap.delete(options.key, phase)
	}

	return ObjectUtils.assignWithoutKeys(o, options, ['key', 'fallback'])
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