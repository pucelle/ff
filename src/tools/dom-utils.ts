import {Size} from '../math'


/** Type of style properties. */
export type StylePropertyName = string & keyof CSSStyleDeclaration


/** 
 * Whether `node` is before of or contains `compareNode`.
 * `canEqual` specifies whether two nodes can be equal.
 */
export function isNodeBefore(node: Node, compareNode: Node, canEqual: boolean = false): boolean {
	let result = compareNode.compareDocumentPosition(node)
	return canEqual && result === 0 || (result & node.DOCUMENT_POSITION_PRECEDING) !== 0
}


/** 
 * Whether `node` is after of or been contained by `compareNode`.
 * `canEqual` specifies whether two nodes can be equal.
 */
export function isNodeAfter(node: Node, compareNode: Node, canEqual: boolean = false): boolean {
	let result = compareNode.compareDocumentPosition(node)
	return canEqual && result === 0 || (result & node.DOCUMENT_POSITION_FOLLOWING) !== 0
}


/** Get index of node among it's node siblings. */
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
 * Note that this method may cause reflow.
 */
export function getStyleValue(el: Element, propertyName: StylePropertyName): string {
	return getComputedStyle(el)[propertyName as any]
}

/**
 * Get computed style value from an element, and convert it to a number.
 * Note that this method may cause reflow.
 */
export function getStyleValueAsNumber(el: Element, property: StylePropertyName): number {
	let value = getStyleValue(el, property)
	return value ? parseFloat(value) || 0 : 0
}


/**
 * Get inner width of specified element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`.
 * Note that this method may cause page reflow.
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
 * Get inner height of specified element, which equals to `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`.
 * Note that this method may cause page reflow.
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
 * Get inner size of specified element, which equals `clientSize - paddingSizes` or `size - paddingSizes - scrollbarSize`.
 * Note that this method may cause page reflow.
 */
export function getInnerSize(el: Element): Size {
	return new Size(getInnerWidth(el), getInnerHeight(el))
}


/**
 * Get outer width of specified element, which equals `offsetWidth + marginWidths`.
 * Note that this method may cause page reflow.
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
 * Get outer height of specified element, which equals `offsetHeight + marginHeights`.
 * Note that this method may cause page reflow.
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
 * Get outer size of specified element, which equals `offsetSize + marginSizes`.
 * Note that this method may cause page reflow.
 */
export function getOuterSize(el: HTMLElement): Size {
	return new Size(getOuterWidth(el), getOuterHeight(el))
}
