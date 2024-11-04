import {WeakPairKeysListMap} from '../structs'
import {Point} from '../math'


type EventHandler = (e: Event) => void

/** Cache a event listener. */
interface EventListener {
	type: string
	handler: EventHandler
	boundHandler: EventHandler
	scope: any
}


/** Cache event listeners. */
const EventListenerMap: WeakPairKeysListMap<EventTarget, string, EventListener> = new WeakPairKeysListMap()


/** 
 * Bind an event listener on an event target.
 * Can specify `scope` to identify listener when un-binding, and will pass it to listener handler.
 */
export function on(el: EventTarget, type: string, handler: EventHandler, scope: any = null, options: AddEventListenerOptions = {}) {
	let boundHandler = scope ? handler.bind(scope) : handler
	bindEvent(el, type, handler, scope, boundHandler, options)
}

/** 
 * Bind an event listener on an event target, triggers for only once.
 * Can specify `scope` to identify listener when un-binding, and will pass it to listener handler.
 * 
 * Equals bind with `once: true` in options.
 */
export function once(el: EventTarget, type: string, handler: EventHandler, scope: any = null, options: AddEventListenerOptions = {}) {
	options.once = true
	on(el, type, handler, scope, options)
}


/** Bind event internally. */
export function bindEvent(el: EventTarget, type: string, handler: EventHandler, scope: any, boundHandler: EventHandler, options: AddEventListenerOptions) {
	if (options.once) {
		boundHandler = bindOnce(el, type, handler, scope, boundHandler)
	}

	let eventListener = {
		type,
		handler,
		boundHandler,
		scope,
	}

	EventListenerMap.add(el, type, eventListener)
	el.addEventListener(type, boundHandler, options)
}


function bindOnce(el: EventTarget, type: string, handler: EventHandler, scope: any, boundHandler: EventHandler) {
	return function(e: Event) {
		boundHandler(e)
		off(el, type, handler, scope)
	}
}


/** 
 * Unbind all event listeners that match specified parameters.
 * If `handler` binds a `scope`, here it must provide the same value to remove the listener.
 */
export function off(el: EventTarget, type: string, handler: EventHandler, scope: any = null) {
	let listeners = EventListenerMap.get(el, type)
	if (!listeners) {
		return
	}

	for (let i = listeners.length - 1; i >= 0; i--) {
		let listener = listeners[i]
		
		if (listener.handler === handler && (!scope || listener.scope === scope)) {
			el.removeEventListener(type, listener.boundHandler)
			EventListenerMap.delete(el, type, listener)
		}
	}
}


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
export function getClientPosition(e: MouseEvent | TouchEvent): Point {
	let eventItem = toSingle(e)

	return eventItem
		? new Point(eventItem.clientX, eventItem.clientY)
		: new Point(0, 0)
}


/** 
 * Get the event happened position in page origin.
 * Compare with `client` origin, `page` origin is affected by page scrolling. 
 */
export function getPagePosition(e: MouseEvent | TouchEvent): Point {
	let eventItem = toSingle(e)

	return eventItem
		? new Point(eventItem.pageX, eventItem.pageY)
		: new Point(0, 0)
}


/** Check whether have pointer device, like mouse. */
export function havePointer(): boolean {
	return matchMedia('(pointer:fine)').matches
}


/** Check whether event comes from Apple Pencil. */
export function comeFromApplePencil(e: Event): boolean {
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
	
	return new Promise(resolve => {
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
	}) as Promise<void>
}


let documentCompleteCallbacks: (() => void)[] | null = []

function callDocumentCompleteCallbacks() {

	// May add more when call a previous callback.
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

	return new Promise(resolve => {
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
	}) as Promise<void>
}
