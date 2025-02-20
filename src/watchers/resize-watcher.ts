import {ListMap} from '../structs'
import {bindCallback} from '../utils'


type ResizeObserverCallback = (entry: ResizeObserverEntry) => void


/** 
 * Help to dispatch resize observer callback for several elements,
 * according to a single observer.
 */
let observer: ResizeObserver | null

/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<Element, ResizeObserverCallback> = new ListMap()


/** Accept resize entries. */
function onResizeCallback(entries: ResizeObserverEntry[]) {
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
 * Observe an element,
 * to get notification callback immediately and after size of `el` get changed.
 * You should remember don't change watching container size in the callback.
 */
export function watch(el: Element, callback: ResizeObserverCallback, scope: any = null, options: ResizeObserverOptions = {}) {
	if (!observer) {
		observer = new ResizeObserver(onResizeCallback)
	}

	let boundCallback = bindCallback(callback, scope)
	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	observer.observe(el, options)
	CallbackMap.add(el, boundCallback)
}


/** 
 * Unobserve resizing of an element.
 * If `callback` omitted, unwatch all callbacks for element.
 */
export function unwatch(el: Element, callback?: ResizeObserverCallback, scope?: any) {
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