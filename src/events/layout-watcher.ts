import * as ResizeEvents from './resize-events'
import * as IntersectionEvents from './intersection-events'
import {ObjectUtils, Interval, AnimationFrame, DOMUtils} from '../utils'
import {untilUpdateComplete} from '../observe'
import * as DocumentWatcher from './document-watcher'


/** Watcher types. */
type LayoutWatcherType = 'show' | 'hide' | 'in-view' | 'out-view' | 'size' | 'rect'

/** Watcher callback. */
type LayoutWatcherCallback<T extends LayoutWatcherType> = (state: ReturnType<(typeof WatcherStateGetters)[T]>) => void

/** Options for `LayoutWatcher`. */
export interface LayoutWatcherOptions {

	/** If need to unwatch after first time calls callback. */
	once: boolean

	/** Whether calls callback immediately. */
	immediate: boolean

	/** If specified as `true`, force check state per animation frame, and ignores `checkIntervalTime`. */
	checkPerAnimationFrame: boolean

	/** A millisecond count, if specified, force use per interval timer to check state. */
	checkIntervalTime?: number
}


const DefaultLayoutWatcherOptions: LayoutWatcherOptions = {
	once: false,
	immediate: false,
	checkPerAnimationFrame: false,
	checkIntervalTime: undefined
}


const WatcherStateGetters = {

	'show'(el: HTMLElement): boolean {
		return el.offsetWidth > 0 || el.offsetHeight > 0
	},

	'hide'(el: HTMLElement): boolean {
		return el.offsetWidth === 0 && el.offsetHeight === 0
	},

	'in-view'(el: HTMLElement): boolean {
		return DOMUtils.isRectIntersectWithViewport(el.getBoundingClientRect())
	},

	'out-view'(el: HTMLElement): boolean {
		return !DOMUtils.isRectIntersectWithViewport(el.getBoundingClientRect())
	},

	'size'(el: HTMLElement): SizeLike {
		return {
			width : el.clientWidth,
			height: el.clientHeight,
		}
	},
	
	'rect'(el: HTMLElement): BoxLike {
		let rect = el.getBoundingClientRect()

		return {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
		}
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
	options?: Partial<LayoutWatcherOptions>
): () => void {
	let watcher = new Watcher(el, type, callback, options)
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
	function wrappedCallback(state: ReturnType<(typeof WatcherStateGetters)[T] & boolean>) {
		if (state) {
			watcher.unwatch()
		}
		
		callback(state)
	}

	let watcher = new Watcher(el, type, wrappedCallback as LayoutWatcherCallback<T>, options)
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

	private frameId: number | null = null
	private interval: Interval | null = null
	private oldState: any = null

	constructor(el: HTMLElement, type: T, callback: LayoutWatcherCallback<T>, options?: Partial<LayoutWatcherOptions>) {
		this.el = el
		this.type = type
		this.callback = callback
		this.options = options ? {...options, ...DefaultLayoutWatcherOptions} : DefaultLayoutWatcherOptions
		this.stateGetter = WatcherStateGetters[type]
	}
	
	/** Reset current state. */
	private async initState() {
		await untilUpdateComplete()
		this.oldState = this.stateGetter(this.el)
	}

	/** Begin to watch. */
	watch() {
		if (this.options.checkPerAnimationFrame) {
			this.frameId = AnimationFrame.requestNext(this.checkStateOnAnimationFrame.bind(this))
			this.initState()
		}
		else if (this.options.checkIntervalTime) {
			this.interval = new Interval(this.checkState.bind(this), this.options.checkIntervalTime)
			this.initState()
		}
		else if (this.type === 'size') {
			ResizeEvents.on(this.el, this.onResized, this)
		}
		else if (this.type === 'in-view' || this.type === 'out-view') {
			IntersectionEvents.on(this.el, this.onIntersectionChange, this)
		}
		else {
			DocumentWatcher.bind(this.checkState, this)
			this.initState()
		}
	}

	/** End watch. */
	unwatch() {
		if (this.options.checkPerAnimationFrame) {
			if (this.frameId) {
				AnimationFrame.cancel(this.frameId)
			}
		}
		else if (this.options.checkIntervalTime) {
			this.interval?.cancel()
		}
		else if (this.type === 'size') {
			ResizeEvents.off(this.el, this.onResized, this)
		}
		else if (this.type === 'in-view' || this.type === 'out-view') {
			IntersectionEvents.off(this.el, this.onIntersectionChange, this)
		}
		else {
			DocumentWatcher.unbind(this.checkState, this)
		}
	}
	
	private onResized(entry: ResizeObserverEntry) {
		this.callback(entry.contentRect as any)

		if (this.options.once) {
			this.unwatch()
		}
	}

	private onIntersectionChange(entry: IntersectionObserverEntry) {
		let newState = this.type === 'in-view' ? entry.intersectionRatio > 0 : entry.intersectionRatio === 0
		this.callback(newState as any)

		if (this.options.once) {
			this.unwatch()
		}
	}

	private async checkStateOnAnimationFrame() {
		await untilUpdateComplete()
		this.checkState()
		this.frameId = AnimationFrame.requestNext(this.checkStateOnAnimationFrame.bind(this))
	}

	private checkState() {
		let newState = this.stateGetter(this.el)

		if (!ObjectUtils.deepEqual(newState, this.oldState)) {
			this.oldState = newState
			this.callback(newState as any)
			
			if (this.options.once) {
				this.unwatch()
			}
		}
	}
}
