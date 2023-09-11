export namespace DOMUtils {

	/** Whether `node` before or contains `compareNode`. */
	export function isNodeBefore(node: Node, compareNode: Node, canEqual: boolean = false): boolean {
		let result = compareNode.compareDocumentPosition(node)
		return canEqual && result === 0 || (result & node.DOCUMENT_POSITION_PRECEDING) !== 0
	}

	
	/** Whether `node` after or been contained by `compareNode`. */
	export function isNodeAfter(node: Node, compareNode: Node, canEqual: boolean = false): boolean {
		let result = compareNode.compareDocumentPosition(node)
		return canEqual && result === 0 || (result & node.DOCUMENT_POSITION_FOLLOWING) !== 0
	}


	/** Get index of node among it's siblings. */
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

	/** Get index of element among it's element siblings. */
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



	/** Type of style properties. */
	export type StylePropertyName = string & keyof CSSStyleDeclaration

	/**
	 * Get computed style value from an element.
	 * Note that this method may cause reflow.
	 */
	export function getStyleValue(el: Element, propertyName: StylePropertyName): string {
		return getComputedStyle(el)[propertyName as any]
	}

	/**
	 * Get computed style value as number from an element.
	 * Note that this method may cause reflow.
	 */
	export function getStyleValueAsNumber(el: Element, property: StylePropertyName): number {
		let value = getStyleValue(el, property)
		return value ? parseFloat(value) || 0 : 0
	}

	/**
	 * Get inner width of element, which equals `clientWidth - paddingWidths` or `width - paddingWidths - scrollbarWidth`.
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
	 * Get inner height of element, which equals to `clientHeight - paddingHeights` or `height - paddingHeights - scrollbarHeight`.
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
	 * Get outer width of element, which equals `offsetWidth + marginWidths`.
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
	 * Get inner height of element, which equals `offsetHeight + marginHeights`.
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
}