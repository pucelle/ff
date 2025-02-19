import {bindCallback} from '../utils'
import * as DocumentWatcher from './document-watcher'
import {ListMap} from '../structs'


type RectObserverCallback = (rect: DOMRect) => void


/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<HTMLElement, RectObserverCallback> = new ListMap()

/** Cache elements' rect boxes. */
const ElementRectCache: WeakMap<HTMLElement, DOMRect> = new WeakMap()

let documentWatcherBound = false


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
 * Note that this method wll read dom properties, please ensure rendering has completed.
 */
export function watch(el: HTMLElement, callback: RectObserverCallback, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)
	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	CallbackMap.add(el, boundCallback)
	ElementRectCache.set(el, el.getBoundingClientRect())

	if (!documentWatcherBound) {
		DocumentWatcher.bind(checkOnDocumentWatcherCallback)
		documentWatcherBound = true
	}
}


/** End watch rect of an element. */
export function unwatch(el: HTMLElement, callback: RectObserverCallback, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)
	CallbackMap.delete(el, boundCallback)

	if (CallbackMap.keyCount() === 0) {
		DocumentWatcher.unbind(checkOnDocumentWatcherCallback)
		documentWatcherBound = false
	}
}