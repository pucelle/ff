import {promiseWithResolves} from '@pucelle/lupos'


/** From a mouse or touch event, get the mouse event or the first touch in the touch list. */
export function toSingle(e: MouseEvent | TouchEvent): MouseEvent | Touch | null {
	if (e.type.startsWith('touch')) {
		return (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0] || null
	}
	else {
		return e as MouseEvent
	}
}


/** 
 * Get the event happened position in client origin.
 * The `client` represents your browser's viewport area.
 * Compare with `page`, `client` origin is not affected by page scrolling. 
 */
export function getClientPosition(e: MouseEvent | TouchEvent): DOMPoint {
	let eventItem = toSingle(e)

	return eventItem
		? new DOMPoint(eventItem.clientX, eventItem.clientY)
		: new DOMPoint(0, 0)
}


/** 
 * Get the event happened position in page origin.
 * Compare with `client` origin, `page` origin is affected by page scrolling. 
 */
export function getPagePosition(e: MouseEvent | TouchEvent): DOMPoint {
	let eventItem = toSingle(e)

	return eventItem
		? new DOMPoint(eventItem.pageX, eventItem.pageY)
		: new DOMPoint(0, 0)
}


/** Get the event happened position in screen origin. */
export function getScreenPosition(e: MouseEvent | TouchEvent): DOMPoint {
	let eventItem = toSingle(e)

	return eventItem
		? new DOMPoint(eventItem.screenX, eventItem.screenY)
		: new DOMPoint(0, 0)
}


/** Check whether have pointer device, like mouse. */
export function havePointer(): boolean {
	return matchMedia('(pointer:fine)').matches
}


/** Check whether can hover with mouse or pencil. */
export function canHover(): boolean {
	return matchMedia('(hover:hover)').matches
}


/** Check whether event comes from Apple Pencil. */
export function fromApplePencil(e: Event): boolean {
	if (!(e.type.startsWith('touch'))) {
		return false
	}

	let singleE = toSingle(e as TouchEvent) as any
	if (!singleE) {
		return false
	}

	// `touchType` is only available on apple ios safari.
	return singleE.touchType === 'stylus'
}


let windowLoadedCallbacks: (() => void)[] | null = []

function callWindowLoadedCallbacks() {

	// May add more when call a previous callback.
	for (let i = 0; i < windowLoadedCallbacks!.length; i++) {
		let callback = windowLoadedCallbacks![i]
		callback()
	}
	
	windowLoadedCallbacks = null
}

/** 
 * Returns a promise which will be resolved after window loaded,
 * or be resolved immediately if window is already loaded.
 */
export async function untilWindowLoaded() {
	if (windowLoadedCallbacks === null) {
		return
	}
	
	let {promise, resolve} = promiseWithResolves()
	windowLoadedCallbacks!.push(resolve)

	if (windowLoadedCallbacks!.length === 1) {
		let entries = window.performance.getEntriesByType('navigation')
		if (entries.length > 0 && (entries[0] as any).loadEventEnd > 0) {
			callWindowLoadedCallbacks()
		}
		else {
			window.addEventListener('load', callWindowLoadedCallbacks, {once: true})
		}
	}

	return promise
}


let documentCompleteCallbacks: (() => void)[] | null = []

function callDocumentCompleteCallbacks() {

	// May add more when emptying callbacks.
	for (let i = 0; i < documentCompleteCallbacks!.length; i++) {
		let callback = documentCompleteCallbacks![i]
		callback()
	}
	
	documentCompleteCallbacks = null
}

/** 
 * Returns a promise which will be resolved after document completed,
 * or be resolved immediately if document is already completed.
 */
export async function untilDocumentComplete() {
	if (documentCompleteCallbacks === null) {
		return
	}

	let {promise, resolve} = promiseWithResolves()
	documentCompleteCallbacks!.push(resolve)

	if (documentCompleteCallbacks!.length === 1) {
		let entries = window.performance.getEntriesByType('navigation')
		if (entries.length > 0 && (entries[0] as any).domContentLoadedEventEnd > 0) {
			callDocumentCompleteCallbacks()
		}
		else {
			document.addEventListener('DOMContentLoaded', callDocumentCompleteCallbacks, {once: true})
		}
	}
	
	return promise
}
