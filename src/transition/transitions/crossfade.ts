import {BarrierQueue} from '../../tracking'
import {PairKeysMap} from '../../structs'
import {ObjectUtils} from '../../utils'
import {TransitionOptions, TransitionProperties, TransitionResult, Transition} from '../transition'


export interface CrossFadeTransitionOptions extends TransitionOptions {

	/** The key to match a pair of elements. */
	key: string | number

	/** 
	 * Define the fallback transition when no matched element.
	 * E.g., `{fallback: fade()}`.
	 * By default no fallback defined, no transition will be played.
	 */
	fallback?: TransitionResult
}


/** Cache "Crossfade Key" -> "enter / leave" -> Element. */
const CrossFadeElementMatchMap: PairKeysMap<string | number, 'enter' | 'leave', Element> = new PairKeysMap()

/** 
 * Help to sync enter and leave cross fade transitions,
 * make sure they can communicate before playing.
 * For `crossfade` transition.
 */
const CrossFadeTransitionBarrierQueue = new BarrierQueue()


/** 
 * When enter, transform from the leave element to current state.
 * When leave, transform from current state to the leave element.
 * So you can see one element cross fade to another element.
 * Use Web Animations API, fallback to initial state after transition end.
 */
export const crossfade = Transition.define(async function(el: Element, options: CrossFadeTransitionOptions, phase: 'enter' | 'leave') {
	CrossFadeElementMatchMap.set(options.key, phase, el)

	// Sync same keyed enter and leave transitions.
	await CrossFadeTransitionBarrierQueue.barrier(0)

	let oppositePhase: 'enter' | 'leave' = phase === 'enter' ? 'leave' : 'enter'
	let oppositeEl = CrossFadeElementMatchMap.get(options.key, oppositePhase)

	// Fallback when there is no opposite element.
	if (!oppositeEl) {
		let fallback = options.fallback
		if (!fallback) {
			return null
		}

		return fallback.getter(el, fallback.options, phase)
	}

	let boxEl = el.getBoundingClientRect()
	let boxOp = oppositeEl.getBoundingClientRect()

	// Transform box of current element to box of opposite element.
	let transform = transformMatrixFromBoxPair(boxEl, boxOp)

	let o: TransitionProperties = {
		startFrame: {
			transform: transform.toString(),
			opacity: '0',
		},
		endFrame: {
			transform: 'none',
			opacity: getComputedStyle(el).opacity,
		},
	}

	return ObjectUtils.assignWithoutKeys(o, options, ['key', 'fallback'])
})


/** 
 * Make a transform matrix, which will convert `fromBox` to `toBox`.
 * Not use `Matrix` at `@pucelle/ff` because it imports additional `10kb` zipped codes.
 */
function transformMatrixFromBoxPair(fromBox: BoxLike, toBox: BoxLike): DOMMatrix {
	let fromX = fromBox.x + fromBox.width / 2
	let fromY = fromBox.y + fromBox.height / 2
	let toX = toBox.x + toBox.width / 2
	let toY = toBox.y + toBox.height / 2

	let matrix = new DOMMatrix()
		.translateSelf(-fromX, -fromY)
		.scaleSelf(toBox.width / fromBox.width, toBox.height / fromBox.height)
		.translateSelf(toX, toY)

	return matrix
}