import {normativeStyleValue} from "./util"

export type StyleName = Exclude<string & keyof CSSStyleDeclaration, 'length' | 'parentRule'> | 'willChange'


/**
 * Get computed style value as number from element.
 * @param el The element to get numeric value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
export function getNumeric(el: Element, property: StyleName): number {
	let value = getStyle(el, property)
	return parseFloat(value) || 0
}


/**
 * Get computed style value from element.
 * @param el The element to get style value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
export function getStyle(el: Element, property: StyleName): string {
	return getComputedStyle(el)[property as keyof CSSStyleDeclaration]
}


/**
 * Set style value for element.
 * @param el The element to set CSS value.
 * @param property The property name in camel case. `backgroundColor` as example.
 * @param value The value in string or number type. E.g.: value `100` for `width` property wil be fixed to `100px`. 
 */
export function setStyle(el: HTMLElement, property: StyleName, value : number | string): void

/**
 * Set style values for element.
 * @param el The element to set CSS values.
 * @param propertyMap The property name in camel case, `backgroundColor` as example.
 */
export function setStyle(el: HTMLElement, propertyMap: {[key in StyleName]?: string | number}): void

export function setStyle(el: HTMLElement, property: StyleName | {[key in StyleName]?: string | number}, value?: number | string) {
	if (typeof property === 'object') {
		for (let prop of Object.keys(property)) {
			setStyle(el, prop as StyleName, property[prop as StyleName] as string | number)
		}
	}
	else {
		el.style.setProperty(property, normativeStyleValue(property, value!))
	}
}
