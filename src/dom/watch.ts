import {isInview, getRect, Rect} from './node'


type WatchType = keyof typeof WATCH_STATE_FN
type WatchCallback<Type extends WatchType> = (state: ReturnType<(typeof WATCH_STATE_FN)[Type]>) => void


export const WATCH_STATE_FN = {

	show (el: HTMLElement): boolean {
		return el.offsetWidth > 0 || el.offsetHeight > 0
	},

	hide (el: HTMLElement): boolean {
		return el.offsetWidth === 0 && el.offsetHeight === 0
	},

	inview (el: HTMLElement): boolean {
		return isInview(el)
	},

	outview (el: HTMLElement): boolean {
		return !isInview(el)
	},

	size (el: HTMLElement): {width: number, height: number} {
		return {
			width : el.clientWidth,
			height: el.clientHeight,
		}
	},
	
	rect (el: HTMLElement): Rect {
		return getRect(el)
	},
}

export let watchInterval = 20


/**
 * Watch specified state. Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview' | 'size' | 'rect'`.
 * @param callback The callback to call when state changed.
 */
export function watch<Type extends WatchType>(el: HTMLElement, type: Type, callback: WatchCallback<Type>): () => void {
	return bindWatch(false, false, false, el, type, callback)
}


/**
 * Watch specified state, call callback immediately with current state`. Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview' | 'size' | 'rect'`.
 * @param callback The callback to call when state changed.
 */
export function watchImmediately<Type extends WatchType>(el: HTMLElement, type: Type, callback: WatchCallback<Type>): () => void {
	return bindWatch(false, false, true, el, type, callback)
}


/**
 * Watch specified state until it changed. Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview' | 'size' | 'rect'`.
 * @param callback The callback to call when state changed.
 */
export function watchOnce<Type extends WatchType>(el: HTMLElement, type: WatchType, callback: WatchCallback<Type>): () => void {
	return bindWatch(true, false, false, el, type, callback)
}


/**
 * Watch specified state until it becomes true. Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type The state to watch, can be `'show' | 'hide' | 'inview' | 'outview'`.
 * @param callback The callback to call when state becomes true.
 */
export function watchUntil<Type extends 'show' | 'hide' | 'inview' | 'outview'>(el: HTMLElement, type: Type, callback: WatchCallback<Type>): () => void {
	return bindWatch(true, true, false, el, type, callback)
}


function bindWatch(isOnce: boolean, untilTrue: boolean, immediate: boolean, el: HTMLElement, type: WatchType, callback: Function): () => void {
	let getState = WATCH_STATE_FN[type]
	let oldState: any
	let intervalId: any = null
	let observer: any = null

	if (!getState) {
		throw new Error(`Failed to watch, type "${type}" is not supported`)
	}

	if (untilTrue || immediate) {
		oldState = getState(el)

		if (oldState && untilTrue || immediate) {
			callback(oldState)
		}
	}
	
	if (untilTrue && oldState) {
		return unwatch
	}

	if (type === 'size' && typeof ((window as any).ResizeObserver) === 'function') {
		observer = new (window as any).ResizeObserver(onResize)
		observer.observe(el)
	}
	else if ((type === 'inview' || type ===  'outview') && typeof IntersectionObserver === 'function') {
		observer = new IntersectionObserver(onInviewChange)
		observer.observe(el)
	}
	else {
		oldState = getState(el)

		intervalId = setInterval(() => {
			let newState = getState(el)
			onChange(newState)
		}, watchInterval)
	}

	function onResize(entries: any) {
		for (let {contentRect} of entries) {
			onChange({
				width: contentRect.width,
				height: contentRect.height
			})
		}
	}

	function onInviewChange(entries: IntersectionObserverEntry[]) {
		for (let {intersectionRatio} of entries) {
			let newState = type === 'inview' ? intersectionRatio > 0 : intersectionRatio === 0
			onChange(newState)
		}
	}

	function onChange(newState: unknown) {
		if (!valueOrObjectEqual(newState, oldState)) {
			callback(oldState = newState)

			if (isOnce || untilTrue && newState) {
				unwatch()
			}
		}
	}

	function unwatch() {
		if (intervalId) {
			clearInterval(intervalId)
			intervalId = null
		}
		else if (observer) {
			observer.unobserve(el)
		}
	}

	return unwatch
}


function valueOrObjectEqual(a: unknown, b: unknown): boolean {
	if (a === b) {
		return true
	}

	if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
		return false
	}

	let keysA = Object.keys(a)
	let keysB = Object.keys(b)
	
	if (keysA.length !== keysB.length) {
		return false
	}

	for (let key of keysA) {
		if (!b.hasOwnProperty(key)) {
			return false
		}

		let valueA = (a as any)[key]
		let valueB = (b as any)[key]

		if (valueA !== valueB) {
			return false
		}
	}

	return true
}