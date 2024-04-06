import {WeakDoubleKeysListMap} from '../structs'
import {Point} from '../math'


type EventHandler = (e: Event) => void

/** Cache a event listener. */
interface EventListener {
	type: string
	handler: EventHandler
	boundHandler: EventHandler
	scope: any
}


/** Register document event handlers. */
export namespace DOMEvents {

	/** Cache event listeners. */
	const EventListenerMap: WeakDoubleKeysListMap<EventTarget, string, EventListener> = new WeakDoubleKeysListMap()


	/** 
	 * Bind a event listener on an event target.
	 * Can specify `scope` to identify listener, and will pass it to listener handler.
	 */
	export function on(el: EventTarget, type: string, handler: EventHandler, scope: any = null, options: AddEventListenerOptions | boolean = false) {
		bindEvent(false, el, type, handler, scope, options)
	}

	/** 
	 * Bind a event listener on event target, triggers for only once.
	 * Can specify `scope` to identify listener, and will pass it to listener handler.
	 */
	export function once(el: EventTarget, type: string, handler: EventHandler, scope: any = null, options: AddEventListenerOptions | boolean = false) {
		bindEvent(true, el, type, handler, scope, options)
	}


	function bindEvent(once: boolean, el: EventTarget, type: string, handler: EventHandler, scope: object | undefined, options: AddEventListenerOptions | boolean) {
		if (typeof options === 'boolean') {
			options = {capture: options}
		}

		if (once) {
			options.once = true
		}

		let boundHandler = scope ? handler.bind(scope) : handler

		let eventListener = {
			type: type,
			handler,
			boundHandler,
			scope,
		}

		EventListenerMap.add(el, type, eventListener)
		el.addEventListener(type, boundHandler, options)
	}


	/** 
	 * Unbind event listeners.
	 * If listener binds a `scope`, here must match it to remove the listener.
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


	/** From a mouse or touch event, to get the same mouse event or the first touch. */
	export function toSingle(e: MouseEvent | TouchEvent): MouseEvent | Touch | null {
		if (e.type.startsWith('touch')) {
			return (e as TouchEvent).touches[0] || (e as TouchEvent).changedTouches[0] || null
		}
		else {
			return e as MouseEvent
		}
	}


	/** Get the event happened position in screen origin. */
	export function getScreenPosition(e: MouseEvent | TouchEvent): Point {
		let eventItem = DOMEvents.toSingle(e)

		return eventItem
			? new Point(eventItem.clientX, eventItem.clientY)
			: new Point(0, 0)
	}


	/** Whether event come from Apple Pencil. */
	export function comeFromApplePencil(e: Event): boolean {
		if (!(e.type.startsWith('touch'))) {
			return false
		}

		let singleE = toSingle(e as TouchEvent) as any
		if (!singleE) {
			return false
		}

		return singleE.touchType === 'stylus'
	}

	
	/** 
	 * Returns a promise which will be resolved after window loaded,
	 * or be resolved immediately if window is already loaded.
	 */
	export function untilWindowLoaded() {
		return new Promise(resolve => {
			let entrys = window.performance.getEntriesByType('navigation')
			if (entrys.length > 0 && (entrys[0] as any).loadEventEnd > 0) {
				resolve()
			}
			else {
				window.addEventListener('load', () => resolve(), {once: true})
			}
		}) as Promise<void>
	}


	/** 
	 * Returns a promise which will be resolved after document completed,
	 * or be resolved immediately if document is already completed.
	 */
	export function untilDocumentComplete() {
		return new Promise(resolve => {
			let entrys = window.performance.getEntriesByType('navigation')
			if (entrys.length > 0 && (entrys[0] as any).domContentLoadedEventEnd > 0) {
				resolve()
			}
			else {
				document.addEventListener('DOMContentLoaded', () => resolve(), {once: true})
			}
		}) as Promise<void>
	}
}