import {getStyleAsNumber} from './style'


export type Rect = {-readonly [key in keyof ClientRect]: number }


/**
 * Returns the index of node in it's node siblings.
 * @param node The node.
 */
export function getNodeIndex(node: Node): number {
	if (node.parentNode) {
		let i = 0
		for (let child of node.parentNode.childNodes) {
			if (child === node) {
				return i
			}
			i++
		}
	}

	return -1
}


/**
 * Returns the index of element in it's element siblings.
 * @param el The node.
 */
export function getElementIndex(el: Element): number {
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
 * Returns inner width of element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`.
 * Note that this method may cause page reflow.
 * @param el The element to get width.
 */
export function getInnerWidth(el: Element): number {
	let w = el.clientWidth
	if (w) {
		return el.clientWidth - getStyleAsNumber(el, 'paddingLeft') - getStyleAsNumber(el, 'paddingRight')
	}
	else {
		return 0
	}
}


/**
 * Returns inner height of element, which equals to `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`.
 * Note that this method may cause page reflow.
 * @param el The element to get height.
 */
export function getInnerHeight(el: Element): number {
	let h = el.clientHeight
	if (h) {
		return h - getStyleAsNumber(el, 'paddingTop') - getStyleAsNumber(el, 'paddingBottom')
	}
	else {
		return 0
	}
}


/**
 * Returns outer width of element, which equals `offsetWidth + marginWidths`.
 * Note that this method may cause page reflow.
 * @param el The element to get width.
 */
export function getOuterWidth(el: HTMLElement) {
	let w = el.offsetWidth
	if (w) {
		return w + getStyleAsNumber(el, 'marginLeft') + getStyleAsNumber(el, 'marginRight')
	}
	else {
		return 0
	}
}


/**
 * Returns inner height of element, which equals `offsetHeight + marginHeights`.
 * Note that this method may cause page reflow.
 * @param el The element to get height.
 */
export function getOuterHeight(el: HTMLElement) {
	let h = el.offsetHeight
	if (h) {
		return h + getStyleAsNumber(el, 'marginTop') + getStyleAsNumber(el, 'marginBottom')
	}
	else {
		return 0
	}
}


/**
 * Returns an object like `getBoundingClientRect`, the didderence is it always returns the rect of visible part for `<html>`.
 * Note that this method may cause page reflow.
 * @param el The element to get rect size.
 */
export function getRect(el: Element): Rect {
	if (el === document.documentElement) {
		let dw = document.documentElement.clientWidth
		let dh = document.documentElement.clientHeight

		return {
			top: 0,
			right: dw,
			bottom: dh,
			left: 0,
			width: dw,
			height: dh
		}
	}
	else {
		let rect = el.getBoundingClientRect()

		return {
			top: rect.top,
			right: rect.right,
			bottom: rect.bottom,
			left: rect.left,
			width: rect.width,
			height: rect.height
		}
	}
}


/**
 * Check if element is visible in current viewport, Otherwise element can't be covered.
 * Note that this method may cause page reflow.
 * @param el The element to check if is in view.
 * @param percentage Specify how much percentage of el size implies in view.
 */
export function isInViewport(el: Element, percentage: number = 0.5): boolean {
	let dw = document.documentElement.clientWidth
	let dh = document.documentElement.clientHeight
	let rect = getRect(el)

	let xIntersect = Math.min(dw, rect.right)  - Math.max(0, rect.left)
	let yIntersect = Math.min(dh, rect.bottom) - Math.max(0, rect.top)

	let inRange = xIntersect / Math.min(rect.width , dw) > percentage
		&& yIntersect / Math.min(rect.height, dh) > percentage

	if (inRange) {
		let notBeenCovered = el.contains(document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2))
		if (notBeenCovered) {
			return true
		}
	}

	return false
}
