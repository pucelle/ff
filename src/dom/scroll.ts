import {animatePropertyTo, AnimationEasing} from './animate'


/**
 * Returns if element can scroll.
 * May return `true` although element has no scroll bar.
 * Note that this method may cause reflow.
 * @param el The element to check scrolling.
 */
export function isContentOverflow(el: HTMLElement) {
	return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
}


let scrollBarWidth: number | null = null

/**
 * Get scroll bar width.
 * After first running, the returned value will keep unchanged.
 * Note that this method will cause reflow for the first time.
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
 * Find the closest scroll wrapper, which has `overflow: auto / scroll` set.
 * Note that this method may cause reflow.
 * @param el The element to check scrolling from.
 */
export function getClosestScrollWrapper(el: HTMLElement): HTMLElement | null {
	while (el
		&& el.scrollWidth <= el.clientWidth
		&& el.scrollHeight <= el.clientHeight) {
		el = el.parentElement!
	}

	return el
}


/**
 * Scroll scrollbars in closest scroll wrapper for minimal distance to let element enter into the viewport area.
 * Returns `true` if scrolled.
 * @param el The element you want to see.
 * @param gap Keep a little distance from the element's edge to the viewport's edge.
 * @param duration If specified, will run an animation when scrolling.
 * @param easing The animation esing.
 */
export function scrollToView(el: HTMLElement, gap: number = 0, duration: number = 0, easing: AnimationEasing = 'ease-out'): boolean {
	let wrapper = getClosestScrollWrapper(el)
	if (!wrapper) {
		return false
	}

	let direction = getScrollDirection(wrapper)
	if (!direction) {
		return false
	}

	if (direction === 'y') {
		let oldScrollY = wrapper.scrollTop
		let newScrollY: number | null = null
		let offsetY = getScrollOffset(el, wrapper, direction)

		// Needs to scroll for pxs to top edges align
		let topOffset = offsetY - gap - oldScrollY

		// Needs to scroll for pxs to bottom edges align
		let botOffset = offsetY + el.offsetHeight + gap - wrapper.clientHeight - oldScrollY

		// Needs to scroll up
		if (topOffset < 0 && botOffset < 0) {
			newScrollY = Math.max(topOffset, botOffset) + oldScrollY
		}
		// Needs to scroll down
		else if (botOffset > 0 && topOffset > 0) {
			newScrollY = Math.min(botOffset, topOffset) + oldScrollY
		}

		if (newScrollY !== null && newScrollY !== oldScrollY) {
			if (duration) {
				animatePropertyTo(wrapper, 'scrollTop', newScrollY, duration, easing)
			}
			else {
				wrapper.scrollTop = newScrollY
			}

			return true
		}

		return false
	}

	if (direction === 'x') {
		let offsetX = getScrollOffset(el, wrapper, direction)
		let scrollX = wrapper.scrollLeft
		let newScrollX = 0
		let startOffset = offsetX - gap - scrollX
		let endOffset = offsetX + el.offsetWidth + gap - scrollX - wrapper.clientWidth

		if (startOffset < 0 && endOffset < 0 || el.offsetWidth > wrapper.clientWidth) {
			newScrollX = Math.max(0, offsetX - gap)
		}
		else if (endOffset > 0 && startOffset > 0) {
			newScrollX = Math.min(wrapper.scrollWidth, offsetX + el.offsetWidth + gap) - wrapper.clientWidth
		}

		if (newScrollX !== scrollX) {
			if (duration) {
				animatePropertyTo(wrapper, 'scrollLeft', newScrollX, duration, easing)
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
 * Returns the scroll direction of scroll wrapper, may be `'x' | 'y' | ''`.
 * @param wrapper The element to get scroll direction.
 */
export function getScrollDirection(wrapper: HTMLElement): 'x' | 'y' | '' {
	let direction: 'x' | 'y' | '' = ''

	if (wrapper.scrollHeight > wrapper.clientHeight) {
		direction = 'y'
	}
	else if (wrapper.scrollWidth > wrapper.clientWidth) {
		direction = 'x'
	}

	return direction
}


/**
 * Get element's position in it's scroll wrapper's scroll area,
 * which also means the scroll wrapper's scrollTop when when top edges align.
 * This value is not affected by current scroll position.
 * @param el The element to test offset.
 * @param wrapper The scroll wrapper.
 * @param direction The scroll direction, `'x' | 'y'`.
 */
export function getScrollOffset(el: HTMLElement, wrapper: HTMLElement, direction: 'x' | 'y'): number {
	let prop: 'offsetLeft' | 'offsetTop' = direction === 'x' ? 'offsetLeft' : 'offsetTop'
	let parent = el.offsetParent as HTMLElement
	let y = el[prop]

	if (!parent || parent === wrapper) {}
	else if (parent.contains(wrapper)) {
		y -= wrapper[prop]
	}
	else {
		while (parent.offsetParent && parent.offsetParent !== wrapper) {
			parent = parent.offsetParent as HTMLElement
			y += parent[prop]
		}
	}

	return y
}


/**
 * Scroll scrollbars to let element in the top of the viewport area.
 * Returns true if scrolled.
 * @param el The element you want to see.
 * @param gap Keep a little distance from the element's edge to the viewport's edge.
 * @param duration If specified, will run an animation when scrolling.
 * @param easing The animation esing.
 */
export function scrollToTop(el: HTMLElement, gap: number = 0, duration: number = 0, easing: AnimationEasing = 'ease-out'): boolean {
	let wrapper = getClosestScrollWrapper(el)
	if (!wrapper) {
		return false
	}
	
	let offsetY = getScrollOffset(el, wrapper, 'y')
	let oldScrollY = wrapper.scrollTop
	let newScrollY = Math.max(0, offsetY - gap)

	if (newScrollY !== oldScrollY) {
		if (duration) {
			animatePropertyTo(wrapper, 'scrollTop', newScrollY, duration, easing)
		}
		else {
			wrapper.scrollTop = newScrollY
		}

		return true
	}

	return false
}