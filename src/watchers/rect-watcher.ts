import {ListMap} from '../structs'
import {bindCallback} from '../utils'
import * as DocumentWatcher from './document-watcher'
import * as ResizeWatcher from './resize-watcher'


type RectObserverCallback = (rect: DOMRect) => void


/** Cache element -> bound callbacks. */
const CallbackMap: ListMap<Element, RectObserverCallback> = /*#__PURE__*/new ListMap()

/** Cache elements' rect boxes. */
const ElementRectCache: WeakMap<Element, DOMRect> = /*#__PURE__*/new WeakMap()

let documentWatcherBound = false

/** Check each element rect. */
function checkOnDocumentWatcherCallback() {
	for (let el of CallbackMap.keys()) {
		checkElementRect(el)
	}
}

/** Check a resized element using the same rect comparison as document changes. */
function onResizeCallback(entry: ResizeObserverEntry) {
	checkElementRect(entry.target)
}

/** Notify only when the element's position or size actually changed. */
function checkElementRect(el: Element) {
	let callbacks = CallbackMap.get(el)
	if (!callbacks) {
		return
	}

	let newRect = el.getBoundingClientRect()
	let oldRect = ElementRectCache.get(el)

	if (oldRect
		&& oldRect.x === newRect.x
		&& oldRect.y === newRect.y
		&& oldRect.width === newRect.width
		&& oldRect.height === newRect.height
	) {
		return
	}

	ElementRectCache.set(el, newRect)

	for (let callback of [...callbacks]) {
		callback(newRect)
	}
}


/**
 * Watch rect of an element, get notified by `callback` if this rect get changed.
 * Note that this method may cause additional page re-layout.
 */
export function watch(el: Element, callback: RectObserverCallback, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)
	if (CallbackMap.has(el, boundCallback)) {
		return
	}

	let firstWatcher = !CallbackMap.hasKey(el)
	CallbackMap.add(el, boundCallback)

	if (firstWatcher) {
		ElementRectCache.set(el, el.getBoundingClientRect())
		ResizeWatcher.watch(el, onResizeCallback)
	}

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
	let wasWatched = CallbackMap.hasKey(el)

	if (callback) {
		let boundCallback = bindCallback(callback, scope)
		CallbackMap.delete(el, boundCallback)
	}
	else {
		CallbackMap.deleteOf(el)
	}

	if (wasWatched && !CallbackMap.hasKey(el)) {
		ResizeWatcher.unwatch(el, onResizeCallback)
		ElementRectCache.delete(el)
	}

	if (CallbackMap.keyCount() === 0) {
		DocumentWatcher.unbind(checkOnDocumentWatcherCallback)
		documentWatcherBound = false
	}
}
