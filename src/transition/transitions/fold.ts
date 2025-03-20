import {ObjectUtils} from '../../utils'
import {TransitionOptions, Transition, TransitionProperties} from '../transition'


export interface FoldTransitionOptions extends TransitionOptions {

	/** 
	 * Fold on vertical or horizontal direction.
	 * Default value is `vertical`
	 */
	direction?: 'vertical' | 'horizontal'

	/** 
	 * If want element is also fade out when leave, or fade in when enter,
	 * specifies this value to `true`.
	 * Default value is `false`.
	 */
	fade?: boolean
}


/** 
 * When enter, fold from height or width 0 to natural height or width.
 * When leave, fold from natural height or width to 0.
 * Note you should normally set `overflow: hidden` to avoid content overflow.
 * Uses Web Animations API, fallback to initial state after transition end.
 */
export const fold = Transition.define(function(el: HTMLElement, options: FoldTransitionOptions = {}) {
	let direction = options.direction ?? 'vertical'
	let size = direction === 'vertical' ? el.offsetHeight : el.offsetWidth
	let prop = direction === 'vertical' ? 'height' : 'width'
	let computed = getComputedStyle(el)

	let paddingValue1 = direction === 'vertical' ? computed.paddingTop : computed.paddingLeft
	let paddingValue2 = direction === 'vertical' ? computed.paddingBottom : computed.paddingRight
	let paddingProp1: keyof CSSStyleDeclaration = direction === 'vertical' ? 'paddingTop' : 'paddingLeft'
	let paddingProp2: keyof CSSStyleDeclaration = direction === 'vertical' ? 'paddingBottom' : 'paddingRight'

	let marginValue1 = direction === 'vertical' ? computed.marginTop : computed.marginLeft
	let marginValue2 = direction === 'vertical' ? computed.marginBottom : computed.marginRight
	let marginProp1: keyof CSSStyleDeclaration = direction === 'vertical' ? 'marginTop' : 'marginLeft'
	let marginProp2: keyof CSSStyleDeclaration = direction === 'vertical' ? 'marginBottom' : 'marginRight'

	let o: TransitionProperties = {
		startFrame: {
			[prop]: '0',
			[paddingProp1]: '0',
			[paddingProp2]: '0',
			[marginProp1]: '0',
			[marginProp2]: '0',
		},
		endFrame: {
			[prop]: size + 'px',
			[paddingProp1]: paddingValue1,
			[paddingProp2]: paddingValue2,
			[marginProp1]: marginValue1,
			[marginProp2]: marginValue2,
		},
	}

	if (options.fade) {
		o.startFrame.opacity = '0'
		o.endFrame.opacity = '1'
	}

	return ObjectUtils.assignWithoutKeys(o, options, ['direction', 'fade'])
})