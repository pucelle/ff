import {normativeStyleValue} from "./util"

export type StyleName = Exclude<string & keyof CSSStyleDeclaration, 'length' | 'parentRule'> | 'willChange'


/**
 * Get computed style value as number from element.
 * Note that this method may cause reflow.
 * @param el The element to get numeric value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
export function getStyleAsNumber(el: Element, property: StyleName): number {
	let value = getStyle(el, property)
	return value ? parseFloat(value) || 0 : 0
}


/**
 * Get computed style value from element.
 * Note that this method may cause reflow.
 * @param el The element to get style value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
export function getStyle(el: Element, property: StyleName): string {
	return getComputedStyle(el)[property as keyof CSSStyleDeclaration]
}


/**
 * Set value of specified `property` for element.
 * @param el The element to set CSS value.
 * @param property The property name in camel case. `backgroundColor` as example.
 * @param value The value in string or number type. E.g.: value `100` for `width` property wil be fixed to `100px`. 
 */
export function setStyle(el: HTMLElement, property: StyleName, value : number | string): void

/**
 * Assign styles whose properties and values specified by `propertyMap` to element.
 * @param el The element to set CSS values.
 * @param propertyMap The property name in camel case, `backgroundColor` as example.
 */
export function setStyle(el: HTMLElement, propertyMap: {[key in StyleName]?: string | number}): void

export function setStyle(el: HTMLElement, propertyOrMap: StyleName | {[key in StyleName]?: string | number}, value?: number | string) {
	if (typeof propertyOrMap === 'object') {
		for (let prop of Object.keys(propertyOrMap)) {
			setStyle(el, prop as StyleName, propertyOrMap[prop as StyleName] as string | number)
		}
	}
	else {
		el.style.setProperty(propertyOrMap, normativeStyleValue(propertyOrMap, value!))
	}
}
