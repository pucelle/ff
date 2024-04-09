import {WebAnimationEasingName, getCSSEasingValue} from './transition'


export namespace WebAnimations {

	/** Default animation duration, plays aniamtion for millseconds according to this property by default. */
	export const DefaultDuration: number = 200

	/** Default animation duration, plays aniamtion with easing according to this property by default. */
	export const DefaultEasing: WebAnimationEasingName = 'ease-out-quad'

	/** Cache element and their current playing animation. */
	const ElementAnimationMap: WeakMap<Element, Animation> = new WeakMap()


	/**
	 * Execute standard web animation on element.
	 * After animation end, the state of element will go back to the start state.
	 */
	export function animate(
		el: Element,
		startFrame: Keyframe,
		endFrame: Keyframe,
		duration: number = DefaultDuration,
		easing: WebAnimationEasingName = DefaultEasing
	) {
		if (!el.animate) {
			return Promise.resolve(false)
		}

		stop(el)
	
		let cubicEasing = getCSSEasingValue(easing)

		let animation = el.animate([startFrame, endFrame], {
			easing: cubicEasing,
			duration,
		})

		ElementAnimationMap.set(el, animation)

		return new Promise(function(resolve) {
			animation.addEventListener('finish', function() {
				ElementAnimationMap.delete(el)
				resolve(true)
			}, false)

			animation.addEventListener('cancel', function() {
				ElementAnimationMap.delete(el)
				resolve(false)
			}, false)
		}) as Promise<boolean>
	}


	/**
	 * Stop executing web animation on specified element.
	 * Returns whether animation stopped.
	 */
	export function stop(el: Element): boolean {
		let animation = ElementAnimationMap.get(el)
		if (animation) {
			animation.cancel()
			ElementAnimationMap.delete(el)

			return true
		}

		return false
	}


	/** Test whether element is playing an animation. */
	export function isPlaying(el: Element): boolean {
		let animation = ElementAnimationMap.get(el)
		if (animation) {
			return true
		}

		return false
	}
}