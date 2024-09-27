import {ObjectUtils} from '../../utils'
import {TransitionOptions, TransitionProperties, Transition} from '../transition'


export interface DrawTransitionOptions extends TransitionOptions {

	/** 
	 * Set `duration` by path length, `duration = length / speed`.
	 * E.g., `speed = 1`, `length = 500px`, final duration is `500ms`.
	 * Replace `duration` parameter if specified.
	 */
	speed?: number
}


/** 
 * When enter, draw the line or path from start to end.
 * When leave, erase the line or path from end to start.
 */
export const draw = Transition.define(function(el: SVGGeometryElement, options: DrawTransitionOptions = {}) {
	let {duration, speed} = options
	let length = el.getTotalLength()

	if (speed !== undefined) {
		duration = length / speed
	}

	let o: TransitionProperties = {
		startFrame: {
			strokeDasharray: String(length),
			strokeDashoffset: String(length),
		},
		endFrame: {
			strokeDasharray: String(length),
			strokeDashoffset: '0',
		},
	}

	if (duration !== undefined) {
		o.duration = duration
	}

	return ObjectUtils.assignExclude(o, options, ['speed', 'duration'])
})