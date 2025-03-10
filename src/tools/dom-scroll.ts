import {PerFrameTransitionEasingName, PerFrameTransition} from '../transition'


/** Cached scroll bar width. */
let scrollBarWidth: number | null = null

/** Cache the element and the transition playing. */
const RunningScrollTransitions: WeakMap<Element, PerFrameTransition> = new WeakMap()


/**
 * Get scroll bar width.
 * After first time running, the returned value will keep constant.
 * Note that this method may cause page re-layout when call it the first time.
 */
export function getScrollbarWidth(): number {
	if (scrollBarWidth !== null) {
		return scrollBarWidth
	}

	let div = document.createElement('div')
	div.style.cssText = 'width:100px; height:100px; overflow:scroll; position:absolute; left:-100px; top:-100px;'
	document.body.append(div)

	scrollBarWidth = div.offsetWidth - div.clientWidth
	div.remove()

	return scrollBarWidth
}


/**
 * Find the closest scroll wrapper, which is the closest ancestral element,
 * and it's contents get overflow.
 * Note this method can test get scroll wrapper only when overflow happens.
 * Note this method read dom properties and may cause page re-layout.
 */
export function findClosestSizedScrollWrapper(el: HTMLElement): HTMLElement | null {
	while (el) {
		if (getSizedOverflowDirection(el) !== null) {
			return el
		}

		el = el.parentElement!
	}

	return null
}


/**
 * Find the closest scroll wrapper, which is the closest ancestral element,
 * and has `overflow: auto / scroll` set.
 * Note this method can test get scroll wrapper only when overflow happens.
 * Note this method read dom properties and may cause page re-layout.
 */
export function findClosestCSSScrollWrapper(el: HTMLElement): HTMLElement | null {
	while (el) {
		if (getCSSOverflowDirection(el) !== null) {
			return el
		}

		el = el.parentElement!
	}

	return null
}


/** 
 * Get the overflow direction of scroll wrapper, may return `horizontal | vertical | null`.
 * Note this method can only test overflow direction when overflow happens.
 * Note this method read dom properties and may cause page re-layout.
 */
export function getSizedOverflowDirection(wrapper: HTMLElement): HVDirection | null {
	let direction: HVDirection | null = null

	if (wrapper.scrollWidth > wrapper.clientWidth) {
		direction = 'horizontal'
	}
	else if (wrapper.scrollHeight > wrapper.clientHeight) {
		direction = 'vertical'
	}

	return direction
}


/** 
 * Get the overflow direction of scroll wrapper, which has `overflow: auto / scroll` set.
 * May return `horizontal | vertical | null`.
 * If can overflow in both directions, returns `vertical`.
 * Note this method read dom properties and may cause page re-layout.
 */
export function getCSSOverflowDirection(wrapper: HTMLElement): HVDirection | null {
	let direction: HVDirection | null = null
	let style = getComputedStyle(wrapper)

	if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
		direction = 'vertical'
	}
	else if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
		direction = 'horizontal'
	}

	return direction
}


/**
 * Get element's offset position relative to wrapper element.
 * This value equals to their document position difference without any scrolling,
 * So it's not affected by scroll positions.
 */
export function getNonScrollOffset(el: HTMLElement, wrapper: HTMLElement, direction: HVDirection): number {
	let property: 'offsetLeft' | 'offsetTop' = direction === 'horizontal' ? 'offsetLeft' : 'offsetTop'
	let parent = el
	let offset = 0

	// Accumulate offset values, until wrapper.
	while (parent) {
		offset += parent[property]
		parent = parent.offsetParent as HTMLElement

		// Out of range of wrapper.
		if (parent.contains(wrapper)) {
			if (parent === wrapper.offsetParent) {
				offset -= wrapper[property]
			}
			break
		}
	}

	return offset
}


/**
 * Scroll scrollbar in specified direction of closest scroll wrapper,
 * for minimal distance to make element to become fully visible.
 * @param scrollDirection `horizontal` | `vertical` | `null`, if is null, will detect scroll direction.
 * @param gap Reserve a little distance from the element's edge away from scroll viewport edge, default value is `0`.
 * @param duration Transition duration, default value is `0`.
 * @param easing Transition easing, default value is `0`.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export async function scrollToView(
	el: HTMLElement,
	scrollDirection: HVDirection | null,
	gap: number = 0,
	duration: number = 0,
	easing: PerFrameTransitionEasingName = 'ease-out'
): Promise<boolean> {
	let wrapper = findClosestSizedScrollWrapper(el)
	if (!wrapper) {
		return false
	}

	scrollDirection = scrollDirection || getSizedOverflowDirection(wrapper)
	if (!scrollDirection) {
		return false
	}

	RunningScrollTransitions.get(wrapper)?.cancel()

	if (scrollDirection === 'vertical') {
		let oldScrollY = wrapper.scrollTop
		let newScrollY: number | null = null
		let offsetY = getNonScrollOffset(el, wrapper, scrollDirection)

		// Needs to scroll for pxs to top edges align.
		let startOffset = offsetY - gap - oldScrollY

		// Needs to scroll for pxs to bottom edges align.
		let endOffset = offsetY + el.offsetHeight + gap - wrapper.clientHeight - oldScrollY

		// Needs to scroll up.
		if (startOffset < 0 && endOffset < 0) {
			newScrollY = Math.max(startOffset, endOffset) + oldScrollY
		}
		// Needs to scroll down.
		else if (endOffset > 0 && startOffset > 0) {
			newScrollY = Math.min(endOffset, startOffset) + oldScrollY
		}

		if (newScrollY !== null && newScrollY !== oldScrollY) {
			if (duration) {
				let transition = new PerFrameTransition({
					duration,
					easing,
				})

				transition.playBetween(
					oldScrollY,
					newScrollY,
					(value: number) => {
						wrapper!.scrollTop = value
					}
				)

				RunningScrollTransitions.set(wrapper, transition)
				return transition.untilEnd()
			}
			else {
				wrapper.scrollTop = newScrollY
			}

			return true
		}

		return false
	}

	if (scrollDirection === 'horizontal') {
		let oldScrollX = wrapper.scrollLeft
		let newScrollX: number | null = null
		let offsetX = getNonScrollOffset(el, wrapper, scrollDirection)
		let startOffset = offsetX - gap - oldScrollX
		let endOffset = offsetX + el.offsetWidth + gap - wrapper.clientWidth - oldScrollX

		if (startOffset < 0 && endOffset < 0 || el.offsetWidth > wrapper.clientWidth) {
			newScrollX = Math.max(0, offsetX - gap)
		}
		else if (endOffset > 0 && startOffset > 0) {
			newScrollX = Math.min(wrapper.scrollWidth, offsetX + el.offsetWidth + gap) - wrapper.clientWidth
		}

		if (newScrollX !== null && newScrollX !== oldScrollX) {
			if (duration) {
				let transition = new PerFrameTransition({
					duration,
					easing,
				})

				transition.playBetween(
					oldScrollX,
					newScrollX,
					(value: number) => {
						wrapper!.scrollLeft = value
					}
				)

				RunningScrollTransitions.set(wrapper, transition)
				return await transition.untilEnd()
			}
			else {
				wrapper.scrollLeft = newScrollX
			}

			return true
		}
	}

	return false
}


/**
 * Scroll closest scrollbar to make element in the top most or left most of the scroll viewport.
 * @param scrollDirection `horizontal` | `vertical` | `null`, if is null, will detect scroll direction.
 * @param gap Reserve a little distance from the element's edge away from scroll viewport edge, default value is `0`.
 * @param duration Transition duration, default value is `0`.
 * @param easing Transition easing, default value is `0`.

 * Returns a promise which will be resolved by whether scrolled.
 */
export async function scrollToStart(
	el: HTMLElement,
	scrollDirection: HVDirection | null,
	gap: number = 0,
	duration: number = 0,
	easing: PerFrameTransitionEasingName = 'ease-out'
): Promise<boolean> {
	let wrapper = findClosestSizedScrollWrapper(el)
	if (!wrapper) {
		return false
	}

	scrollDirection = scrollDirection || getSizedOverflowDirection(wrapper)
	if (!scrollDirection) {
		return false
	}

	if (RunningScrollTransitions.has(el)) {
		RunningScrollTransitions.get(el)!.cancel()
	}
	
	let offset = getNonScrollOffset(el, wrapper, scrollDirection)
	let property: 'scrollLeft' | 'scrollTop' = scrollDirection === 'horizontal' ? 'scrollLeft' : 'scrollTop'
	let oldScroll = wrapper[property]
	let newScroll = Math.max(0, offset - gap)

	if (newScroll !== oldScroll) {
		if (duration) {
			let transition = new PerFrameTransition({
				duration,
				easing,
			})

			transition.playBetween(
				oldScroll,
				newScroll,
				(value: number) => {
					wrapper![property] = value
				}
			)

			RunningScrollTransitions.set(el, transition)

			return transition.untilEnd()
		}
		else {
			wrapper[property] = newScroll
		}

		return true
	}

	return false
}


/**
 * Scroll closest scrollbar to make element in the top most of the scroll viewport.
 * @param gap Reserve a little distance from the element's edge away from scroll viewport edge, default value is `0`.
 * @param duration Transition duration, default value is `0`.
 * @param easing Transition easing, default value is `0`.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export function scrollToTop(el: HTMLElement, gap: number = 0, duration: number = 0, easing: PerFrameTransitionEasingName = 'ease-out'): Promise<boolean> {
	return scrollToStart(el, 'vertical', gap, duration, easing)
}


/**
 * Scroll closest scrollbar to make element in the left most of the scroll viewport.
 * @param gap Reserve a little distance from the element's edge away from scroll viewport edge, default value is `0`.
 * @param duration Transition duration, default value is `0`.
 * @param easing Transition easing, default value is `0`.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export function scrollToLeft(el: HTMLElement, gap: number = 0, duration: number = 0, easing: PerFrameTransitionEasingName = 'ease-out'): Promise<boolean> {
	return scrollToStart(el, 'vertical', gap, duration, easing)
}
