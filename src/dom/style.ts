import {normativeStyleValue} from './utils'


/** Type of style properties. */
export type StylePropertyName = Exclude<string & keyof CSSStyleDeclaration, 'length' | 'parentRule'> | 'willChange'


/**
 * Get computed style value as number from element.
 * Note that this method may cause reflow.
 * @param el The element to get numeric value.
 * @param property The property name in camer case, `backgroundColor` as example.
 */
export function getStyleValueAsNumber(el: Element, property: StylePropertyName): number {
	let value = getStyleValue(el, property)
	return value ? parseFloat(value) || 0 : 0
}


/**
 * Get computed style value from element.
 * Note that this method may cause reflow.
 * @param el The element to get style value.
 * @param propertyName The property name in camer case, `backgroundColor` as example.
 */
export function getStyleValue(el: Element, propertyName: StylePropertyName): string {
	return getComputedStyle(el)[propertyName as any]
}


/**
 * Set value of specified `property` for element.
 * @param el The element to set CSS value.
 * @param propertyName The property name in camel case. `backgroundColor` as example.
 * @param value The value in string or number type. E.g.: value `100` for `width` property wil be fixed to `100px`. 
 */
export function setStyleValue(el: HTMLElement | SVGElement, propertyName: StylePropertyName, value : number | string) {
	el.style.setProperty(propertyName, normativeStyleValue(propertyName, value))
}


/**
 * Assign styles whose properties and values specified by `propertyMap` to element.
 * @param el The element to set CSS values.
 * @param propertyMap The property name in camel case, `backgroundColor` as example.
 */
export function setStyleValues(el: HTMLElement | SVGElement, propertyMap: {[key in StylePropertyName]?: string | number}) {
	for (let prop of Object.keys(propertyMap)) {
		setStyleValue(el, prop as StylePropertyName, propertyMap[prop as StylePropertyName]!)
	}
}
