import {HVDirection} from "../math"

/** Cached scroll bar width. */
let scrollBarWidth: number | null = null


/**
 * Get normal scroll bar width.
 * After first time running, the returned value will keep constant.
 * Note that this method may cause page re-layout when call it for the first time.
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
 * Note this method returns `true` only when overflow happens.
 * Note this method read dom properties and may cause page re-layout.
 */
export function findClosestSizedScrollWrapper(el: HTMLElement): {wrapper: HTMLElement, direction: HVDirection} | null {
	while (el) {
		let direction = getSizedOverflowDirection(el)
		if (direction !== null) {
			return {wrapper: el, direction}
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

	if (wrapper.scrollHeight > wrapper.clientHeight) {
		direction = 'vertical'
	}
	else if (wrapper.scrollWidth > wrapper.clientWidth) {
		direction = 'horizontal'
	}

	return direction
}


/**
 * Find the closest scroll wrapper, which is the closest ancestral element,
 * and has `overflow: auto / scroll` set.
 * Note this method returns `true` only when `overflow: auto / scroll` specified.
 * Note this method read dom properties and may cause page re-layout.
 */
export function findClosestCSSScrollWrapper(el: HTMLElement): {wrapper: HTMLElement, direction: HVDirection} | null {
	while (el) {
		let direction = getCSSOverflowDirection(el)
		if (direction !== null) {
			return {wrapper: el, direction}
		}

		el = el.parentElement!
	}

	return null
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
 * This value equals to the element's document position difference to wrapper element
 * without any scrolling affected.
 */
export function getUnScrolledOffset(el: HTMLElement, wrapper: HTMLElement, direction: HVDirection): number {
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
