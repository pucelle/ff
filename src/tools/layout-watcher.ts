import {Box} from '../math'
import {ObjectUtils, Interval, AnimationFrame} from '../utils'


/** Watcher types. */
type LayoutWatcherType = 'show' | 'hide' | 'in-view' | 'out-view' | 'size' | 'rect'

/** Watcher callback. */
type LayoutWatcherCallback<T extends LayoutWatcherType> = (state: ReturnType<(typeof WatcherStateGetters)[T]>) => void

/** Options for `LayoutWatcher`. */
export interface LayoutWatcherOptions {

	/** A millisecond count, if specified, per interval timer to check state. */
	checkIntervalTime?: number

	/** If specified as `true`, check state per animation frame, and ignores `checkIntervalTime`. */
	checkPerAnimationFrame?: boolean
}


const WatcherStateGetters = {

	show(el: HTMLElement): boolean {
		return el.offsetWidth > 0 || el.offsetHeight > 0
	},

	hide(el: HTMLElement): boolean {
		return el.offsetWidth === 0 && el.offsetHeight === 0
	},

	'in-view'(el: HTMLElement): boolean {
		let htmlBox = Box.fromLike(document.documentElement.getBoundingClientRect())
		return Box.fromLike(el.getBoundingClientRect()).isIntersectWith(htmlBox)
	},

	'out-view'(el: HTMLElement): boolean {
		let htmlBox = Box.fromLike(document.documentElement.getBoundingClientRect())
		return !Box.fromLike(el.getBoundingClientRect()).isIntersectWith(htmlBox)
	},

	size(el: HTMLElement): {width: number, height: number} {
		return {
			width : el.clientWidth,
			height: el.clientHeight,
		}
	},
	
	rect(el: HTMLElement): BoxLike {
		return Box.fromLike(el.getBoundingClientRect())
	},
}


/**
 * Watch specified layout state, trigger `callback` if this state get changed.
 * Note that this method may slow page speed and cause additional reflow.
 * Returns a cancel function.
 */
export function watch<T extends LayoutWatcherType>(
	el: HTMLElement,
	type: T,
	callback: LayoutWatcherCallback<T>,
	options?: LayoutWatcherOptions
): () => void {
	let watcher = new Watcher(el, type, callback, options)
	watcher.watch()

	return () => watcher.unwatch()
}


/**
 * Watch specified layout state, trigger `callback` if this state get changed, and cancel watching.
 * Note that this method may slow page speed and cause additional reflow.
 * Returns a cancel function.
 */
export function watchOnce<T extends LayoutWatcherType>(
	el: HTMLElement,
	type: T,
	callback: LayoutWatcherCallback<T>,
	options?: LayoutWatcherOptions
): () => void {
	function wrappedCallback(state: ReturnType<(typeof WatcherStateGetters)[T]>) {
		watcher.unwatch()
		callback(state)
	}

	let watcher = new Watcher(el, type, wrappedCallback, options)
	watcher.watch()

	return () => watcher.unwatch()
}


/**
 * Watch specified layout state, trigger `callback` if the state becomes `true` and never trigger again.
 * Note that this method may slow page speed and cause additional reflow.
 * Returns a cancel function.
 */
export function watchUntil<T extends 'show' | 'hide' | 'in-view' | 'out-view'>(
	el: HTMLElement,
	type: T,
	callback: LayoutWatcherCallback<T>,
	options?: LayoutWatcherOptions
): () => void {
	function wrappedCallback(state: ReturnType<(typeof WatcherStateGetters)[T]>) {
		if (state) {
			watcher.unwatch()
		}
		
		callback(state)
	}

	let watcher = new Watcher(el, type, wrappedCallback, options)
	watcher.watch()

	return () => watcher.unwatch()
}


export class Watcher<T extends LayoutWatcherType> {

	/** Watcher state type, can be `show | hide | in-view | out-view | size | rect`. */
	private readonly type: T

	/** Element being watching state at. */
	private readonly el: HTMLElement

	private readonly callback: LayoutWatcherCallback<T>
	private readonly options: LayoutWatcherOptions
	private readonly stateGetter: typeof WatcherStateGetters[T]

	private observer: any = null
	private frameId: number | null = null
	private interval: Interval | null = null
	private oldState: any = null
	private unwatchChange: (() => void)| null = null

	constructor(el: HTMLElement, type: T, callback: LayoutWatcherCallback<T>, options: LayoutWatcherOptions = {}) {
		this.el = el
		this.type = type
		this.callback = callback
		this.options = options

		this.stateGetter = WatcherStateGetters[type]
	}

	/** Begin to watch. */
	watch() {
		this.resetState()

		if (this.options.checkPerAnimationFrame) {
			this.frameId = AnimationFrame.requestCurrent(this.checkStateInAnimationFrame.bind(this))
		}
		else if (this.options.checkIntervalTime) {
			this.interval = new Interval(this.checkStateInInterval.bind(this), this.options.checkIntervalTime)
		}
		else if (this.type === 'size' && typeof (window as any).ResizeObserver === 'function' && !this.options.checkIntervalTime) {
			this.observer = new (window as any).ResizeObserver(this.onResize.bind(this))
			this.observer.observe(this.el)
		}
		else if ((this.type === 'in-view' || this.type === 'out-view')
			&& typeof IntersectionObserver === 'function' && !this.options.checkIntervalTime
		) {
			this.observer = new IntersectionObserver(this.onInViewChange.bind(this))
			this.observer.observe(this.el)
		}
		else {
			this.unwatchChange = watchDocumentChange(this.checkStateInInterval.bind(this))
		}
	}

	/** End watch. */
	unwatch() {
		if (this.observer) {
			this.observer.disconnect()
		}
		else if (this.options.checkIntervalTime) {
			this.interval?.cancel()
		}
		else if (this.options.checkPerAnimationFrame) {
			if (this.frameId) {
				cancelAnimationFrame(this.frameId)
			}
		}
		else {
			this.unwatchChange?.()
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

	private onInViewChange(entries: IntersectionObserverEntry[]) {
		for (let {intersectionRatio} of entries) {
			let newState = this.type === 'in-view' ? intersectionRatio > 0 : intersectionRatio === 0
			this.onNewState(newState)
		}
	}

	private checkStateInAnimationFrame() {
		let newState = this.stateGetter(this.el)
		this.onNewState(newState)
		this.frameId = AnimationFrame.requestCurrent(this.checkStateInAnimationFrame.bind(this))
	}

	private checkStateInInterval() {
		let newState = this.stateGetter(this.el)
		this.onNewState(newState)
	}

	private onNewState(newState: any) {
		if (!ObjectUtils.deepEqual(newState, this.oldState)) {
			this.oldState = newState
			this.callback(newState)
		}
	}
	
	/** Check state manually. */
	checkState() {
		let newState = this.stateGetter(this.el) as any

		if (!ObjectUtils.deepEqual(newState, this.oldState)) {
			this.oldState = newState
			this.callback(newState)
		}
	}
	
	/** Reset current state. */
	resetState() {
		this.oldState = this.stateGetter(this.el)
	}
}


let mutationObserver: MutationObserver | null = null
let mutationObserverCallbacks: Array<() => void> = []
let willEmitDocumentChange: boolean = false


function watchDocumentChange(callback: () => void) {
	if (!mutationObserver) {
		mutationObserver = new MutationObserver(emitDocumentChangeLater)
		mutationObserver.observe(document.documentElement, {subtree: true, childList: true, attributes: true})
	}

	if (mutationObserverCallbacks.length === 0) {
		window.addEventListener('resize', emitDocumentChangeLater)
		window.addEventListener('wheel', emitDocumentChangeLater)

		if ('ontouchmove' in window) {
			window.addEventListener('touchmove', emitDocumentChangeLater)
		}
	}

	mutationObserverCallbacks.push(callback)

	return function() {
		unwatchDocumentChange(callback)
	}
}

function unwatchDocumentChange(callback: () => void) {
	mutationObserverCallbacks = mutationObserverCallbacks.filter(v => v !== callback)

	if (mutationObserverCallbacks.length === 0 && mutationObserver) {
		mutationObserver.disconnect()
		mutationObserver = null
	}

	if (mutationObserverCallbacks.length === 0) {
		window.removeEventListener('resize', emitDocumentChangeLater)
		window.removeEventListener('wheel', emitDocumentChangeLater)

		if ('ontouchmove' in window) {
			window.removeEventListener('touchmove', emitDocumentChangeLater)
		}
	}
}

function emitDocumentChangeLater() {
	if (!willEmitDocumentChange) {
		AnimationFrame.requestCurrent(emitDocumentChange)
		willEmitDocumentChange = true
	}
}

function emitDocumentChange() {
	for (let callback of mutationObserverCallbacks) {
		callback()
	}
	willEmitDocumentChange = false
}