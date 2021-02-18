import {Interval} from '../base'
import {isVisibleInViewport, getRect, Rect} from './element'


/** Options for `LayoutWacther`. */
export interface LayoutWatcherOptions {

	/** Whether trigger callback for only once. */
	once?: boolean

	/** Whether stop trigger callback after state becomes `true`. */
	untilTrue?: boolean

	/** A millseconds, if specified, use interval to check instead of animation frame or observer classes. */
	intervalTime?: number
}

/** Can watch types. */
type WatchType = 'show' | 'hide' | 'inview' | 'outview' | 'size' | 'rect'

/** Watch callback. */
type WatchCallback<T extends WatchType> = (state: ReturnType<(typeof WatchStateFns)[T]>) => void


const WatchStateFns = {

	show (el: HTMLElement): boolean {
		return el.offsetWidth > 0 || el.offsetHeight > 0
	},

	hide (el: HTMLElement): boolean {
		return el.offsetWidth === 0 && el.offsetHeight === 0
	},

	inview (el: HTMLElement): boolean {
		return isVisibleInViewport(el)
	},

	outview (el: HTMLElement): boolean {
		return !isVisibleInViewport(el)
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


/**
 * Watch specified state, trigger `callback` if state changed.
 * Please makesure everything was rendered before call this.
 * Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type Watch state type, can be `show | hide | inview | outview | size | rect`.
 * @param callback The callback to call when state changed.
 */
export function watchLayout<T extends WatchType>(el: HTMLElement, type: T, callback: WatchCallback<T>): () => void {
	let watcher = new LayoutWatcher(el, type, callback)
	watcher.watch()

	return watcher.unwatch.bind(watcher)
}


/**
 * Watch specified state, trigger `callback` if it changed for only once.
 * Please makesure everything was rendered before call this.
 * Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type Watch state type, can be `show | hide | inview | outview | size | rect`.
 * @param callback The callback to call when state changed.
 */
export function watchLayoutOnce<T extends WatchType>(el: HTMLElement, type: WatchType, callback: WatchCallback<T>): () => void {
	let watcher = new LayoutWatcher(el, type, callback, {once: true})
	watcher.watch()

	return watcher.unwatch.bind(watcher)
}


/**
 * Watch specified state, trigger `callback` if the state becomes `true` and never trigger again.
 * Please makesure everything was rendered before call this.
 * Returns a cancel function.
 * Note that this method may slow page speed and cause additional reflow.
 * @param el The element to watch.
 * @param type Watch state type, can be `show | hide | inview | outview`.
 * @param callback The callback to call when state becomes true.
 */
export function watchLayoutUntil<T extends 'show' | 'hide' | 'inview' | 'outview'>(el: HTMLElement, type: T, callback: WatchCallback<T>): () => void {
	let watcher = new LayoutWatcher(el, type, callback, {untilTrue: true})
	watcher.watch()

	return watcher.unwatch.bind(watcher)
}


export class LayoutWatcher<T extends WatchType> {

	/** Watcher state type, can be `show | hide | inview | outview | size | rect`. */
	private readonly type: T

	/** Watch element. */
	private readonly el: HTMLElement

	/** The callback to call after state changed. */
	private readonly callback: WatchCallback<T>

	private readonly options: LayoutWatcherOptions

	private readonly getState: typeof WatchStateFns[T]

	private observer: any = null
	private frameId: number | null = null
	private interval: Interval | null = null
	private oldState: any = null

	constructor(el: HTMLElement, type: T, callback: WatchCallback<T>, options: LayoutWatcherOptions = {}) {
		this.el = el
		this.type = type
		this.callback = callback
		this.options = options

		this.getState = WatchStateFns[type]
	}

	/** Begin to watch. */
	watch() {
		this.resetState()

		if (this.type === 'size' && typeof (window as any).ResizeObserver === 'function' && !this.options.intervalTime) {
			this.observer = new (window as any).ResizeObserver(this.onResize.bind(this))
			this.observer.observe(this.el)
		}
		else if ((this.type === 'inview' || this.type ===  'outview') && typeof IntersectionObserver === 'function' && !this.options.intervalTime) {
			this.observer = new IntersectionObserver(this.onInviewChange.bind(this))
			this.observer.observe(this.el)
		}
		else if (this.options.intervalTime) {
			this.interval = new Interval(this.checkStateInInterval.bind(this), this.options.intervalTime)
		}
		else {
			this.frameId = requestAnimationFrame(this.checkStateInAnimationFrame.bind(this))
		}
	}

	/** End watch. */
	unwatch() {
		if (this.observer) {
			this.observer.unobserve(this.el)
		}
		else if (this.frameId) {
			cancelAnimationFrame(this.frameId)
		}
		else if (this.interval) {
			this.interval.cancel()
		}
	}
	
	private onResize(entries: any) {
		for (let {contentRect} of entries) {
			this.onNewState({
				width: contentRect.width,
				height: contentRect.height
			})
		}
	}

	private onInviewChange(entries: IntersectionObserverEntry[]) {
		for (let {intersectionRatio} of entries) {
			let newState = this.type === 'inview' ? intersectionRatio > 0 : intersectionRatio === 0
			this.onNewState(newState)
		}
	}

	private checkStateInAnimationFrame() {
		let newState = this.getState(this.el)
		this.onNewState(newState)
		this.frameId = requestAnimationFrame(this.checkStateInAnimationFrame.bind(this))
	}

	private checkStateInInterval() {
		let newState = this.getState(this.el)
		this.onNewState(newState)
	}

	private onNewState(newState: any) {
		if (!this.isValueOrObjectEqual(newState, this.oldState)) {
			this.oldState = newState
			this.callback(newState)

			if (this.options.once || this.options.untilTrue && newState) {
				this.unwatch()
			}
		}
	}
	
	private isValueOrObjectEqual(a: unknown, b: unknown): boolean {
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

	/** 
	 * Check state manually.
	 * Don't forget to call `resetState` before begin to check state.
	 */
	checkState() {
		let newState = this.getState(this.el) as any

		if (!this.isValueOrObjectEqual(newState, this.oldState)) {
			this.oldState = newState
			this.callback(newState)
		}
	}
	
	/** Reset current state. */
	resetState() {
		this.oldState = this.getState(this.el)
	}
}