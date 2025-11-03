import {ListMap} from '../structs'
import {bindCallback} from '../utils'


type IntersectionObserverCallback = (entry: IntersectionObserverEntry) => void


export class IntersectionWatcher {

	/** 
	 * Help to dispatch intersection observer callback for several elements,
	 * according to a single observer.
	 */
	private observer: IntersectionObserver

	/** Cache element -> bound callbacks. */
	private callbackMap: ListMap<Element, IntersectionObserverCallback> = new ListMap()

	constructor(threshold: number[] = [0, 1]) {
		this.observer = new IntersectionObserver(this.onIntersectionCallback.bind(this), {threshold})
	}

	/** Accept intersection entries. */
	private onIntersectionCallback(entries: IntersectionObserverEntry[]) {
		for (let entry of entries) {
			let callbacks = this.callbackMap.get(entry.target)
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
	watch(el: Element, callback: IntersectionObserverCallback, scope: any = null) {
		let boundCallback = bindCallback(callback, scope)

		if (this.callbackMap.has(el, boundCallback)) {
			return
		}

		this.observer.observe(el)
		this.callbackMap.add(el, boundCallback)
	}

	/** 
	 * Unwatch intersection of an element.
	 * If `callback` omitted, unwatch all callbacks for element.
	 */
	unwatch(el: Element, callback?: IntersectionObserverCallback, scope?: any) {
		if (callback) {
			let boundCallback = bindCallback(callback, scope)
			this.callbackMap.delete(el, boundCallback)
		}
		else {
			this.callbackMap.deleteOf(el)
		}

		if (!this.callbackMap.hasKey(el)) {
			this.observer.unobserve(el)
		}
	}
}