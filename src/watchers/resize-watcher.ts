import {ListMap} from '../structs'
import {AnimationFrame, bindCallback} from '../utils'


type ResizeObserverCallback = (entry: ResizeObserverEntry) => void


/** 
 * Help to dispatch resize observer callback for several elements,
 * according to a single observer.
 */
let observer: ResizeObserver | null

/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<Element, ResizeObserverCallback> = new ListMap()

/** Which get prevented to call. */
const PreventingCallbacks: WeakSet<ResizeObserverCallback> = new WeakSet()


/** Accept resize entries. */
function onResizeCallback(entries: ResizeObserverEntry[]) {
	for (let entry of entries) {
		let callbacks = CallbackMap.get(entry.target)
		if (callbacks) {
			for (let callback of [...callbacks]) {
				if (PreventingCallbacks.has(callback)) {
					continue
				}
				
				callback(entry)
			}
		}
	}
}


/** 
 * Observe an element, to get notification after it's size changed.
 * You should remember don't change watching container size in the callback.
 * 
 * Original ResizeObserve will cause getting notification on later than next frame
 * after observe an element, use this will prevent notification for 2 frames.
 */
export function watch(el: Element, callback: ResizeObserverCallback, scope: any = null, options: ResizeObserverOptions = {}) {
	if (!observer) {
		observer = new ResizeObserver(onResizeCallback)
	}

	let boundCallback = bindCallback(callback, scope)
	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	PreventingCallbacks.add(boundCallback)

	// Update after target size changed.
	// Resize watcher will calls update on next frame after started.
	AnimationFrame.requestNext(() => {
		AnimationFrame.requestNext(() => {
			PreventingCallbacks.delete(boundCallback)
		})
	})
	
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