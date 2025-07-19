import {SizeLike} from "../math"

/** Type of style properties. */
export type StylePropertyName = string & keyof CSSStyleDeclaration


/** 
 * Whether `node` is before of or contains `compareNode`.
 * @param canEqual specifies whether two nodes can be equivalent.
 */
export function isNodeBefore(node: Node, compareNode: Node, canEqual: boolean = false): boolean {
	let result = compareNode.compareDocumentPosition(node)
	return canEqual && result === 0 || (result & node.DOCUMENT_POSITION_PRECEDING) !== 0
}


/** 
 * Whether `node` is after of or been contained by `compareNode`.
 * @param canEqual specifies whether two nodes can be equivalent.
 */
export function isNodeAfter(node: Node, compareNode: Node, canEqual: boolean = false): boolean {
	let result = compareNode.compareDocumentPosition(node)
	return canEqual && result === 0 || (result & node.DOCUMENT_POSITION_FOLLOWING) !== 0
}


/** 
 * Get index of node among it's node siblings.
 * Note this method will iterate sibling nodes.
 */
export function nodeIndexOf(node: Node): number {
	if (!node.parentNode) {
		return -1
	}

	for (let i = 0; i < node.parentNode.childNodes.length; i++) {
		if (node.parentNode.childNodes[i] === node) {
			return i
		}
	}

	return -1
}

/** Get index of specified element among it's element siblings. */
export function elementIndexOf(el: Element): number {
	if (!el.parentElement) {
		return -1
	}

	for (let i = 0; i < el.parentElement.children.length; i++) {
		if (el.parentElement.children[i] === el) {
			return i
		}
	}

	return -1
}



/**
 * Get computed style value from an element.
 * Note that this method may cause re-layout.
 */
export function getStyleValue(el: Element, property: StylePropertyName): string {
	return getComputedStyle(el)[property as any]
}

/**
 * Set style value for an element.
 * Note that this method may cause re-layout.
 */
export function setStyleValue(el: HTMLElement, property: StylePropertyName, value: string) {
	(el.style as any)[property] = value
}

/**
 * Get computed style value from an element, and convert it to a number.
 * Note that this method may cause re-layout.
 */
export function getNumericStyleValue(el: Element, property: StylePropertyName): number {
	let value = getStyleValue(el, property)
	return value ? parseFloat(value) || 0 : 0
}

/**
 * Set style value for an element, convert number value to pixels.
 * Note that this method may cause re-layout.
 */
export function setNumericStyleValue(el: HTMLElement, property: StylePropertyName, value: number) {
	(el.style as any)[property] = value + 'px'
}



/**
 * Get inner width of specified element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`.
 * Note that this method may cause page re-layout.
 */
export function getInnerWidth(el: Element): number {
	let w = el.clientWidth
	if (w) {
		return el.clientWidth - getNumericStyleValue(el, 'paddingLeft') - getNumericStyleValue(el, 'paddingRight')
	}
	else {
		return 0
	}
}

/**
 * Get inner height of specified element, which equals to `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`.
 * Note that this method may cause page re-layout.
 */
export function getInnerHeight(el: Element): number {
	let h = el.clientHeight
	if (h) {
		return h - getNumericStyleValue(el, 'paddingTop') - getNumericStyleValue(el, 'paddingBottom')
	}
	else {
		return 0
	}
}

/**
 * Get inner size of specified element, which equals `clientSize - paddingSizes` or `size - paddingSizes - scrollbarSize`.
 * Note that this method may cause page re-layout.
 */
export function getInnerSize(el: Element): SizeLike {
	return {
		width: getInnerWidth(el),
		height: getInnerHeight(el),
	}
}



/**
 * Get outer width of specified element, which equals `offsetWidth + marginWidths`.
 * Note that this method may cause page re-layout.
 */
export function getOuterWidth(el: HTMLElement) {
	let w = el.offsetWidth
	if (w) {
		return w + getNumericStyleValue(el, 'marginLeft') + getNumericStyleValue(el, 'marginRight')
	}
	else {
		return 0
	}
}

/**
 * Get outer height of specified element, which equals `offsetHeight + marginHeights`.
 * Note that this method may cause page re-layout.
 */
export function getOuterHeight(el: HTMLElement) {
	let h = el.offsetHeight
	if (h) {
		return h + getNumericStyleValue(el, 'marginTop') + getNumericStyleValue(el, 'marginBottom')
	}
	else {
		return 0
	}
}

/**
 * Get outer size of specified element, which equals `offsetSize + marginSizes`.
 * Note that this method may cause page re-layout.
 */
export function getOuterSize(el: HTMLElement): SizeLike {
	return {
		width: getOuterWidth(el),
		height: getOuterHeight(el),
	}
}


/** Check if a rect box intersect with viewport. */
export function isRectIntersectWithViewport(rect: DOMRect): boolean {
	let w = document.documentElement.clientWidth
	let h = document.documentElement.clientHeight
	let viewport = new DOMRect(0, 0, w, h)
	
	let left = Math.max(rect.left, viewport.left)
	let top = Math.max(rect.top, viewport.top)
	let right = Math.min(rect.right, viewport.right)
	let bottom = Math.min(rect.bottom, viewport.bottom)

	if (left > right || top > bottom) {
		return false
	}

	return true
}