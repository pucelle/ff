import {binaryFindIndexToInsert} from '../base/array'
import {getStyleValueAsNumber} from './style'


/** Rect box size and location, all properties are writable. */
export type Rect = {-readonly [key in keyof ClientRect]: number}


/**
 * Get the index of node in it's node siblings.
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
 * Get the index of element in it's element siblings.
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
 * Get inner width of element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`.
 * Note that this method may cause page reflow.
 * @param el The element to get width.
 */
export function getInnerWidth(el: Element): number {
	let w = el.clientWidth
	if (w) {
		return el.clientWidth - getStyleValueAsNumber(el, 'paddingLeft') - getStyleValueAsNumber(el, 'paddingRight')
	}
	else {
		return 0
	}
}


/**
 * Get inner height of element, which equals to `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`.
 * Note that this method may cause page reflow.
 * @param el The element to get height.
 */
export function getInnerHeight(el: Element): number {
	let h = el.clientHeight
	if (h) {
		return h - getStyleValueAsNumber(el, 'paddingTop') - getStyleValueAsNumber(el, 'paddingBottom')
	}
	else {
		return 0
	}
}


/**
 * Get outer width of element, which equals `offsetWidth + marginWidths`.
 * Note that this method may cause page reflow.
 * @param el The element to get width.
 */
export function getOuterWidth(el: HTMLElement) {
	let w = el.offsetWidth
	if (w) {
		return w + getStyleValueAsNumber(el, 'marginLeft') + getStyleValueAsNumber(el, 'marginRight')
	}
	else {
		return 0
	}
}


/**
 * Get inner height of element, which equals `offsetHeight + marginHeights`.
 * Note that this method may cause page reflow.
 * @param el The element to get height.
 */
export function getOuterHeight(el: HTMLElement) {
	let h = el.offsetHeight
	if (h) {
		return h + getStyleValueAsNumber(el, 'marginTop') + getStyleValueAsNumber(el, 'marginBottom')
	}
	else {
		return 0
	}
}


/**
 * Get an rect object just like `getBoundingClientRect`.
 * The didderence is it always returns the rect of visible part for `<html>`, and properties are writable.
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
			height: dh,
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
			height: rect.height,
		}
	}
}


/**
 * Check if element is visible in current viewport, element must also be not fully covered.
 * Note that this method may cause page reflow.
 * @param el The element to check if is in view.
 * @param percentage Specify how much percentage of el size implies in view.
 * @param additionalElement Normally a popup element with `el` as it's trigger. it may cover `el` when page resizing.
 */
export function isVisibleInViewport(el: Element, percentage: number = 0.5, additionalElement?: Element): boolean {
	let dw = document.documentElement.clientWidth
	let dh = document.documentElement.clientHeight
	let rect = getRect(el)

	let xIntersect = Math.min(dw, rect.right)  - Math.max(0, rect.left)
	let yIntersect = Math.min(dh, rect.bottom) - Math.max(0, rect.top)

	let inRange = xIntersect / Math.min(rect.width , dw) > percentage
		&& yIntersect / Math.min(rect.height, dh) > percentage

	if (inRange) {
		if ((el as any).disabled) {
			return true
		}
		
		let elementInPoint = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
		let notBeCovered = el.contains(elementInPoint) || additionalElement?.contains(elementInPoint)
		if (notBeCovered) {
			return true
		}
	}

	return false
}


/** 
 * Locate the first element in els that is is visible inside container.
 * @container Container to check visible inside.
 * @param els Element list to check.
 */
export function locateFirstVisibleIndex(container: Element, els: ArrayLike<Element>): number {
	return locateVisibleIndex(container, els, false)
}


/** 
 * Locate the last element in els that is is visible inside container.
 * @container Container to check visible inside.
 * @param els Element list to check.
 */
export function locateLastVisibleIndex(container: Element, els: ArrayLike<Element>): number {
	return locateVisibleIndex(container, els, true)
}


function locateVisibleIndex(container: Element, els: ArrayLike<Element>, isLast: boolean): number {
	let containerRect = container.getBoundingClientRect()

	let index = binaryFindIndexToInsert(els, (el) => {
		let rect = el.getBoundingClientRect()
		if (rect.bottom <= containerRect.top) {
			return 1
		}
		else if (rect.top >= containerRect.bottom) {
			return -1
		}
		else {
			// If find last, prefer move to right.
			return isLast ? 1 : -1
		}
	})

	if (isLast && index > 0) {
		index -= 1
	}

	return index
}
