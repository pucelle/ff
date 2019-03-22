import {getNumeric} from './css'


/**
 * Returns the index of node in it' node silbings.
 * @param el The node.
 */
export function nodeIndex(el: Node): number {
	if (el.parentNode) {
		let i = 0
		for (let child of el.parentNode.childNodes) {
			if (child === el) {
				return i
			}
			i++
		}
	}

	return -1
}


/**
 * Returns the index of element in it' element silbings.
 * @param el The node.
 */
export function elementIndex(el: Element): number {
	if (el.parentNode) {
		let i = 0
		for (let child of el.parentNode.children) {
			if (child === el) {
				return i
			}
			i++
		}
	}

	return -1
}


/**
 * Returns inner width of element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`. Note that this may cause page reflow.
 * @param el The element to get width.
 */
export function innerWidth(el: Element): number {
	let w = el.clientWidth
	if (w) {
		return el.clientWidth - getNumeric(el, 'paddingLeft') - getNumeric(el, 'paddingRight')
	}
	else {
		return 0
	}
}


/**
 * Returns inner height of element, which equals `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`. Note that this may cause page reflow.
 * @param el The element to get height.
 */
export function innerHeight(el: Element): number {
	let h = el.clientHeight
	if (h) {
		return h - getNumeric(el, 'paddingTop') - getNumeric(el, 'paddingBottom')
	}
	else {
		return 0
	}
}


/**
 * Returns outer width of element, which equals `offsetWidth + marginWidths`. Note that this may cause page reflow.
 * @param el The element to get width.
 */
export function outerWidth(el: HTMLElement) {
	let w = el.offsetWidth
	if (w) {
		return w + getNumeric(el, 'marginLeft') + getNumeric(el, 'marginRight')
	}
	else {
		return 0
	}
}


/**
 * Returns inner height of element, which equals `offsetHeight + marginHeights`. Note that this may cause page reflow.
 * @param el The element to get height.
 */
export function outerHeight(el: HTMLElement) {
	let h = el.offsetHeight
	if (h) {
		return h + getNumeric(el, 'marginTop') + getNumeric(el, 'marginBottom')
	}
	else {
		return 0
	}
}


export type SimpleRect = {[key in 'top' | 'right' | 'bottom' |'left' | 'width' | 'height']: number}

/**
 * Returns an object like `getBoundingClientRect`, the didderence is it always returns the visible part for `<html>`. Note that this may cause page reflow.
 * @param el The element to get rect size.
 */
export function getRect(el: Element): SimpleRect {
	if (el === document.documentElement) {
		let dw = document.documentElement.clientWidth
		let dh = document.documentElement.clientHeight

		return {
			top: 0,
			right: dw,
			bottom: dh,
			left: 0,
			width: dw,
			height: dh,
		}
	}
	else {
		let rect = el.getBoundingClientRect()

		return {
			bottom: rect.bottom,
			height: rect.height,
			left: rect.left,
			right: rect.right,
			top: rect.top,
			width: rect.width,
		}
	}
}


//returns if has enough intersection with viewport
//percentage supports negative value

/**
 * Check if element is visible in current viewport. Note that this may cause page reflow.
 * @param el The element to check if is in view.
 * @param percentage Specify how much percentage of el size implies in view.
 */
export function isInview(el: Element, percentage: number = 0.5): boolean {
	let dw = document.documentElement.clientWidth
	let dh = document.documentElement.clientHeight
	let box = getRect(el)

	let xIntersect = Math.min(dw, box.right)  - Math.max(0, box.left)
	let yIntersect = Math.min(dh, box.bottom) - Math.max(0, box.top)

	return xIntersect / Math.min(box.width , dw) > percentage
		&& yIntersect / Math.min(box.height, dh) > percentage
}