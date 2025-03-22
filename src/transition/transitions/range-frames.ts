import {TransitionOptions, Transition} from '../transition'
import {WebTransitionKeyFrame} from '../web-transition'


export interface FramesTransitionOptions extends TransitionOptions {

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


/** 
 * When enter, play from `startFrame` to `endFrame`.
 * When leave, play from `endFrame` to `startFrame`.
 * Use Web Animations API, fallback to initial state after transition end.
 */
export const rangeFrames = Transition.define(function(_el: Element, options: FramesTransitionOptions) {
	return options
})