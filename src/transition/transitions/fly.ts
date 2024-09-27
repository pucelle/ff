import {ObjectUtils} from '../../utils'
import {Transition, TransitionOptions, TransitionProperties} from '../transition'


export interface FlyTransitionOptions extends TransitionOptions {

	/** 
	 * The x value specifies the translated in x axis before enter or after leave.
	 * Can be number, or css value with unit.
	 * Default value is `0`.
	 */
	x?: number | string

	/** 
	 * The y value specifies the translated in y axis before enter or after leave.
	 * Can be number, or css value with unit.
	 * Default value is `0`.
	 */
	y?: number | string

	/** 
	 * If want element is also fade out when leave, or fade in when enter
	 * specifies this value to `true`.
	 * Default value is `false`.
	 */
	fade?: boolean
}


/** 
 * When enter, translate and fade from specified values to none.
 * When leave, translate and fade from none to specified values.
 */
export const fly = Transition.define(function(el: Element, options: FlyTransitionOptions = {}) {
	let x = options.x || 0
	let y = options.y || 0
	let transform = new DOMMatrix(getComputedStyle(el).transform)

	if (typeof x === 'number') {
		x = x + 'px'
	}

	if (typeof y === 'number') {
		y = y + 'px'
	}

	let flyTransform = new DOMMatrix(`translate(${x}, ${y})`)
	transform.preMultiplySelf(flyTransform)

	let o: TransitionProperties = {
		startFrame: {
			transform: transform.toString(),
		},
		endFrame: {
			transform: 'none',
		},
	}

	if (options.fade) {
		o.startFrame.opacity = '0'
		o.endFrame.opacity = getComputedStyle(el).opacity
	}

	return ObjectUtils.assignExclude(o, options, ['x', 'y', 'fade'])
})