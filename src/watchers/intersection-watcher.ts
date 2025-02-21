import {ListMap} from '../structs'
import {bindCallback} from '../utils'


type IntersectionObserverCallback = (entry: IntersectionObserverEntry) => void


/** 
 * Help to dispatch intersection observer callback for several elements,
 * according to a single observer.
 */
let observer: IntersectionObserver | null = null

/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<Element, IntersectionObserverCallback> = new ListMap()


/** Accept intersection entries. */
function onIntersectionCallback(entries: IntersectionObserverEntry[]) {
	for (let entry of entries) {
		let callbacks = CallbackMap.get(entry.target)
		if (callbacks) {
			for (let callback of [...callbacks]) {
				callback(entry)
			}
		}
	}
}


/** 
 * Watch intersection of an element.
 * Get notified after element's becomes fully visible or fully invisible.
 */
export function watch(el: Element, callback: IntersectionObserverCallback, scope: any = null) {
	if (!observer) {
		observer = new IntersectionObserver(onIntersectionCallback)
	}

	let boundCallback = bindCallback(callback, scope)

	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	observer.observe(el)
	CallbackMap.add(el, boundCallback)
}


/** 
 * Unwatch intersection of an element.
 * If `callback` omitted, unwatch all callbacks for element.
 */
export function unwatch(el: Element, callback?: IntersectionObserverCallback, scope?: any) {
	if (callback) {
		let boundCallback = bindCallback(callback, scope)
		CallbackMap.delete(el, boundCallback)
	}
	else {
		CallbackMap.deleteOf(el)
	}

	if (!CallbackMap.hasKey(el)) {
		observer?.unobserve(el)
	}
}