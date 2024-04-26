import {TransitionEasingName, PerFrameTransition} from '../transition'


/** Cached scroll bar width. */
let scrollBarWidth: number | null = null

/** Cache the element and the transition playing. */
const ScrollTransition: Map<Element, PerFrameTransition> = new Map()


/**
 * Get scroll bar width.
 * After first time running, the returned value will keep constant.
 * Note that this method will cause reflow when call it the first time.
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
 * Find the closest scroll wrapper, which is the closest ancestor element, and contents overflow.
 * Note this method can test get scroll wrapper only when overflow happens.
 * Note that this method may cause reflow.
 */
export function getClosestScrollWrapper(el: HTMLElement): HTMLElement | null {
	while (el) {
		if (getOverflowDirection(el) !== null) {
			return el
		}

		el = el.parentElement!
	}

	return null
}


/**
 * Find the closest scroll wrapper, which is the closest ancestor element,
 * and has `overflow: auto / scroll` set.
 * Note this method can test get scroll wrapper only when overflow happens.
 * Note that this method may cause reflow.
 */
export function getCSSClosestScrollWrapper(el: HTMLElement): HTMLElement | null {
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
 * Note this method may cause reflow.
 */
export function getOverflowDirection(wrapper: HTMLElement): HVDirection | null {
	let direction: HVDirection | null = null

	if (wrapper.scrollWidth > wrapper.clientWidth) {
		direction = 'vertical'
	}
	else if (wrapper.scrollHeight > wrapper.clientHeight) {
		direction = 'horizontal'
	}

	return direction
}


/** 
 * Get the overflow direction of scroll wrapper, which has `overflow: auto / scroll` set.
 * may return `horizontal | vertical | null`.
 * Note this method may cause reflow.
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

		// Outof range of wrapper.
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
 * - `gap`: Reserve a little distance from the element's edge away from scroll viewport edge.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export async function scrollToView(el: HTMLElement, gap: number = 0, duration: number = 0, easing: TransitionEasingName = 'ease-out'): Promise<boolean> {
	let wrapper = getClosestScrollWrapper(el)
	if (!wrapper) {
		return false
	}

	let direction = getOverflowDirection(wrapper)
	if (!direction) {
		return false
	}

	if (ScrollTransition.has(el)) {
		ScrollTransition.get(el)!.cancel()
	}

	if (direction === 'vertical') {
		let oldScrollY = wrapper.scrollTop
		let newScrollY: number | null = null
		let offsetY = getNonScrollOffset(el, wrapper, direction)

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

				ScrollTransition.set(el, transition)

				return transition.untilEnd()
			}
			else {
				wrapper.scrollTop = newScrollY
			}

			return true
		}

		return false
	}

	if (direction === 'horizontal') {
		let oldScrollX = wrapper.scrollLeft
		let newScrollX: number | null = null
		let offsetX = getNonScrollOffset(el, wrapper, direction)
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

				ScrollTransition.set(el, transition)

				return transition.untilEnd()
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
 * Scroll closest scrollbar to make element in the topest or left most of the scroll viewport.
 * - `gap`: Reserve a little distance from the element's edge away from scroll viewport edge.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export async function scrollToStart(el: HTMLElement, gap: number = 0, duration: number = 0, easing: TransitionEasingName = 'ease-out'): Promise<boolean> {
	let scrollDirection = getOverflowDirection(el)
	if (!scrollDirection) {
		return false
	}

	return scrollToStartPosition(scrollDirection, el, gap, duration, easing)
}


/**
 * Scroll closest scrollbar to make element in the topest of the scroll viewport.
 * - `gap`: Reserve a little distance from the element's edge away from scroll viewport edge.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export function scrollToTop(el: HTMLElement, gap: number = 0, duration: number = 0, easing: TransitionEasingName = 'ease-out'): Promise<boolean> {
	return scrollToStartPosition('vertical', el, gap, duration, easing)
}


/**
 * Scroll closest scrollbar to make element in the left most of the scroll viewport.
 * - `gap`: Reserve a little distance from the element's edge away from scroll viewport edge.
 * 
 * Returns a promise which will be resolved by whether scrolled.
 */
export function scrollToLeft(el: HTMLElement, gap: number = 0, duration: number = 0, easing: TransitionEasingName = 'ease-out'): Promise<boolean> {
	return scrollToStartPosition('vertical', el, gap, duration, easing)
}


async function scrollToStartPosition(
	direction: HVDirection,
	el: HTMLElement,
	gap: number = 0,
	duration: number = 0,
	easing: TransitionEasingName = 'ease-out'
): Promise<boolean>
{
	let wrapper = getClosestScrollWrapper(el)
	if (!wrapper) {
		return false
	}

	if (ScrollTransition.has(el)) {
		ScrollTransition.get(el)!.cancel()
	}
	
	let offset = getNonScrollOffset(el, wrapper, direction)
	let property: 'scrollLeft' | 'scrollTop' = direction === 'horizontal' ? 'scrollLeft' : 'scrollTop'
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

			ScrollTransition.set(el, transition)

			return transition.untilEnd()
		}
		else {
			wrapper[property] = newScroll
		}

		return true
	}

	return false
}
