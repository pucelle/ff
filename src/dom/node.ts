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


export type Rect = {[key in 'top' | 'right' | 'bottom' |'left' | 'width' | 'height']: number}

/**
 * Returns an object like `getBoundingClientRect`, the didderence is it always returns the visible part for `<html>`. Note that this may cause page reflow.
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


/** 
 * Returns previous node in node trees. See Elements panel in your Chrome Dev Tool.
 * @param node The node to get previous node from.
 * @param until When specified, the returned node must be contained in the `until` element.
 */
export function getPreviousNode(node: Node, until?: Element): Node | null {
	if (until && node === until) {
		return null
	}

	let prev = node.previousSibling as Node | null
	if (prev) {
		while (prev.lastChild) {
			prev = prev.lastChild
		}
	}
	else {
		prev = node.parentNode

		if (until && prev === until) {
			return null
		}
	}

	return prev
}

/** 
 * Returns next node in node trees. See Elements panel in your Chrome Dev Tool.
 * Note that this may returns the child nodes of `node`.
 * @param node The node to get next node from.
 * @param until When specified, the returned node must be contained in the `until` element.
 */
export function getNextNode(node: Node, until?: Element): Node | null {
	let next = (node.firstChild || node.nextSibling) as Node | null
	if (!next) {
		next = node

		while (next) {
			next = next.parentNode

			if (until && next === until) {
				return null
			}

			if (next && next.nextSibling) {
				next = next.nextSibling
				break
			}
		}
	}

	return next
}


/** 
 * Returns previous element in node trees. See Elements panel in your Chrome Dev Tool.
 * @param el The element to get previous element from.
 * @param until When specified, the returned element must be contained in the `until` element.
 */
export function getPreviousElement(el: Element, until?: Element): Element | null {
	return getPreviousElementMaySkipHidden(el, until || null, false)
}

/** 
 * Returns previous visible element in node trees. See Elements panel in your Chrome Dev Tool.
 * @param el The element to get previous element from.
 * @param until When specified, the returned element must be contained in the `until` element.
 */
export function getPreviousVisibleElement(el: Element, until?: Element): Element | null {
	return getPreviousElementMaySkipHidden(el, until || null, true)
}


/** 
 * Returns next element in node trees. See Elements panel in your Chrome Dev Tool.
 * Note that this may returns the children element of `el`.
 * @param el The element to get next element from.
 * @param until When specified, the returned element must be contained in the `until` element.
 */
export function getNextElement(el: Element, until?: Element): Element | null {
	return getNextElementMaySkipHidden(el, until || null, false)
}

/** 
 * Returns next visible element in node trees. See Elements panel in your Chrome Dev Tool.
 * Note that this may returns the children element of `el`.
 * @param el The element to get next element from.
 * @param until When specified, the returned element must be contained in the `until` element.
 */
export function getNextVisibleElement(el: Element, until?: Element): Element | null {
	return getNextElementMaySkipHidden(el, until || null, true)
}


function getPreviousElementMaySkipHidden(el: Element, until: Element | null, skipHidden: boolean): Element | null {
	if (until && el === until) {
		return null
	}

	let prev = el.previousElementSibling
	while (prev) {
		let willSkip = skipHidden && prev instanceof HTMLElement && prev.hidden
		if (willSkip) {
			prev = prev.previousElementSibling
		}
		else {
			break
		}
	}

	if (prev) {
		while (prev) {
			let lastChild = prev.lastElementChild
			let willSkip = skipHidden && lastChild instanceof HTMLElement && lastChild.hidden
			if (willSkip) {
				prev = prev.lastElementChild
			}
			else {
				break
			}
		}
	}
	else {
		prev = el.parentElement

		if (until && prev === until) {
			return null
		}

		if (prev && skipHidden && prev instanceof HTMLElement && prev.hidden) {
			return getPreviousElementMaySkipHidden(prev, until, true)
		}
	}

	return prev
}

function getNextElementMaySkipHidden(el: Element, until: Element | null, skipHidden: boolean): Element | null {
	let next: Element | null = null
	let isELHidden = skipHidden && el instanceof HTMLElement && el.hidden

	if (!isELHidden) {
		next = el.firstElementChild
		if (next) {
			let willSkip = skipHidden && next instanceof HTMLElement && next.hidden
			if (willSkip) {
				return getNextElementMaySkipHidden(next, until, skipHidden)
			}
		}
	}

	if (!next) {
		next = el.nextElementSibling
		if (next) {
			let willSkip = skipHidden && next instanceof HTMLElement && next.hidden
			if (willSkip) {
				return getNextElementMaySkipHidden(next, until, skipHidden)
			}
		}
	}

	if (!next) {
		next = el

		while (next) {
			next = next.parentElement

			if (until && next === until) {
				return null
			}

			if (next && next.nextElementSibling) {
				next = next.nextElementSibling
				break
			}
		}

		if (next) {
			let willSkip = skipHidden && next instanceof HTMLElement && next.hidden
			if (willSkip) {
				return getNextElementMaySkipHidden(next, until, skipHidden)
			}
		}
	}

	return next
}