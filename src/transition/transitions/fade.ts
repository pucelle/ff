import {TransitionOptions, Transition} from '../transition'


/** 
 * When enter, fade opacity from 0 to 1.
 * When leave, fade opacity from 1 to 0.
 * Use Web Animations API, fallback to initial state after transition end.
 */
export const fade = Transition.define(function(_el: Element, options: TransitionOptions = {}) {
	return {
		...options,
		startFrame: {
			opacity: '0',
		},
		endFrame: {
			opacity: '1',
		},
	}
})