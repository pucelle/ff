import {ListMap} from '../structs'
import {bindCallback} from '../utils'


type ObserverCallback = (entry: IntersectionObserverEntry) => void


/** 
 * Help to dispatch intersection observer callback for several elements,
 * according to a single observer.
 */
const Observer = new IntersectionObserver(onIntersectionCallback.bind(this))

/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<Element, ObserverCallback> = new ListMap()

/** Cache once bound callbacks. */
const OnceMap: WeakSet<ObserverCallback> = new WeakSet()


/** Accept intersection entries. */
function onIntersectionCallback(entries: IntersectionObserverEntry[]) {
	for (let entry of entries) {
		let callbacks = CallbackMap.get(entry.target)
		if (callbacks) {
			for (let callback of [...callbacks]) {
				callback(entry)

				if (OnceMap.has(callback)) {
					CallbackMap.delete(entry.target, callback)
					OnceMap.delete(callback)
				}
			}
		}
	}
}


/** Observe an element. */
export function on(el: Element, callback: ObserverCallback, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)

	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	Observer.observe(el)
	CallbackMap.add(el, boundCallback)
}


/** Observe intersection of an element. */
export function once(el: Element, callback: ObserverCallback, scope: any = null) {
	on(el, callback, scope)
	
	let boundCallback = bindCallback(callback, scope)
	OnceMap.add(boundCallback)
}


/** Unobserve intersection of an element. */
export function off(el: Element, callback: ObserverCallback, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)
	CallbackMap.delete(el, boundCallback)

	if (!CallbackMap.hasOf(el)) {
		Observer.unobserve(el)
	}
}