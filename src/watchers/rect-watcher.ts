import {bindCallback} from '../utils'
import * as DocumentWatcher from './document-watcher'
import {ListMap} from '../structs'
import {untilUpdateComplete} from '../tracking'


type RectObserverCallback = (rect: DOMRect) => void


/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<Element, RectObserverCallback> = new ListMap()

/** Cache elements' rect boxes. */
const ElementRectCache: WeakMap<Element, DOMRect> = new WeakMap()

let documentWatcherBound = false

/** Check each element rect. */
function checkOnDocumentWatcherCallback() {
	for (let el of CallbackMap.keys()) {
		let newRect = el.getBoundingClientRect()
		let oldRect = ElementRectCache.get(el)

		if (oldRect
			&& oldRect.x === newRect.x
			&& oldRect.y === newRect.y
			&& oldRect.width === newRect.width
			&& oldRect.height === newRect.height
		) {
			continue
		}

		for (let callback of CallbackMap.get(el)!) {
			callback(newRect)
		}

		ElementRectCache.set(el, newRect)
	}
}


/**
 * Watch rect of an element, get notified by `callback` if this rect get changed.
 * Note that this method may cause additional page re-layout.
 * It will wait for update complete then read bounding rect.
 */
export async function watch(el: Element, callback: RectObserverCallback, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)
	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	await untilUpdateComplete()

	CallbackMap.add(el, boundCallback)
	ElementRectCache.set(el, el.getBoundingClientRect())

	if (!documentWatcherBound) {
		DocumentWatcher.bind(checkOnDocumentWatcherCallback)
		documentWatcherBound = true
	}
}


/** 
 * End watch rect of an element.
 * If `callback` omitted, unwatch all callbacks for element.
 */
export function unwatch(el: Element, callback?: RectObserverCallback, scope?: any) {
	if (callback) {
		let boundCallback = bindCallback(callback, scope)
		CallbackMap.delete(el, boundCallback)
	}
	else {
		CallbackMap.deleteOf(el)
	}

	if (CallbackMap.keyCount() === 0) {
		DocumentWatcher.unbind(checkOnDocumentWatcherCallback)
		documentWatcherBound = false
	}
}