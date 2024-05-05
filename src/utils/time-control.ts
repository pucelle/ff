import * as AnimationFrame from './animation-frame'


/** Base class for Timeout, Interval... */
abstract class TimeControlFunction<F extends Function> {

	/** Timeout or Interval id, `null` represents it's not exist. */
	protected id: any = null

	/** 
	 * Whether current time control has been canceled.
	 * Readonly outside.
	 */
	canceled: boolean = false

	/** The original function. */
	fn: F

	/** Get or set the associated time in milliseconds. */
	ms: number

	constructor(fn: F, ms: number) {
		this.fn = fn
		this.ms = ms
	}

	abstract reset(): void
	abstract flush(): void
	abstract cancel(): void
}


/** Wrapped a function, throttle or debounce it. */
abstract class WrappedTimeControlFunction<F extends Function> extends TimeControlFunction<F> {

	/** 
	 * The wrapped function that after throttled or debounced.
	 * Readonly outside.
	 */
	wrapped: F

	constructor(fn: F, ms: number) {
		super(fn, ms)
		this.wrapped = this.wrap()
	}

	/** Wrap original function. */
	protected abstract wrap(): F
}



/** Class mode of `setTimeout`. */
export class Timeout<F extends Function = Function> extends TimeControlFunction<F> {

	/** Whether timeout is running. */
	get running(): boolean {
		return !!this.id
	}

	/** 
	 * Restart timeout, even a called or canceled Timeout can be restarted.
	 * Note will call `fn` immediately if `ms` parameter is `0`.
	 */
	reset() {
		if (this.id !== null) {
			clearTimeout(this.id)
		}

		if (this.ms > 0) {
			this.id = setTimeout(this.onTimeout.bind(this), this.ms)
		}
		else {
			this.onTimeout()
		}

		this.canceled = false
	}

	/** 
	 * Start or restart timeout, even a called or canceled Timeout can be restarted.
	 * Note will call `fn` immediately if `ms` parameter is `0`.
	 */
	start() {
		this.reset()
	}

	private onTimeout() {
		this.id = null
		this.fn()
	}

	/** Call original function immediately and cancel timeout. */
	flush() {
		this.cancel()
		this.fn()
	}

	/** Cancel timeout. */
	cancel() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
			this.canceled = true
		}
	}
}

/**
 * Just like `setTimeout`, call `fn` after `ms` milliseconds.
 * Returns a cancel function.
 */
export function timeout(fn: Function, ms: number = 0): () => void {
	let t = new Timeout(fn, ms)
	t.start()
	
	return t.cancel.bind(t)
}



/** Class mode of `setInterval`. */ 
export class Interval<F extends Function = Function> extends TimeControlFunction<F> {

	/** Whether interval is running. */
	get running(): boolean {
		return !!this.id
	}

	/** Restart interval, even it was canceled before. */
	reset() {
		if (this.id !== null) {
			clearInterval(this.id)
		}

		this.id = setInterval(this.onInterval.bind(this), this.ms)
		this.canceled = false
	}

	/** Restart interval, even it was canceled before. */
	start() {
		this.reset()
	}

	private onInterval() {
		this.fn()
	}

	/** Call interval function immediately and reset interval. */
	flush() {
		this.fn()
		this.reset()
	}

	/** Cancel interval function. */
	cancel() {
		if (this.id !== null) {
			clearInterval(this.id)
			this.id = null
			this.canceled = true
		}
	}
}


/** Just like `setInterval`, call `fn` every `ms` milliseconds. */
export function interval(fn: Function, ms: number): () => void {
	let i = new Interval(fn, ms)
	i.start()

	return i.cancel.bind(i)
}



/** Callback with a timestamp as parameter. */
type FrameLoopCallback = (duration: number) => void

/** Repeated animation frames. */ 
export class FrameLoop<F extends FrameLoopCallback = FrameLoopCallback> extends TimeControlFunction<F> {
	
	private startTimestamp: number = 0

	constructor(fn: F) {
		super(fn, 0)
	}

	/** Whether frame loop is running. */
	get running(): boolean {
		return !!this.id
	}

	/** 
	 * Restart animation frame, even it was canceled before.
	 * Calls `fn` with duration parameter `0` immediately.
	 */
	reset() {
		if (this.id !== null) {
			AnimationFrame.cancel(this.id)
		}

		this.id = AnimationFrame.requestCurrent(this.onFirstInterval.bind(this))
		this.canceled = false
		this.fn(0)
	}

	/** 
	 * Start or restart animation frame, even it was canceled before.
	 * Calls `fn` with duration parameter `0` immediately.
	 */
	start() {
		this.reset()
	}

	private onFirstInterval(timestamp: number) {
		this.startTimestamp = timestamp
		this.id = AnimationFrame.requestNext(this.onFrame.bind(this))
	}

	private onFrame(timestamp: number) {
		this.id = AnimationFrame.requestNext(this.onFrame.bind(this))

		// Calls `fn` must after request animation frame,
		// Or will fail if cancel inside `fn`.
		this.fn(timestamp - this.startTimestamp)
	}

	/** Just restart animation frame. */
	flush() {
		this.reset()
	}

	/** Cancel animation frame. */
	cancel() {
		if (this.id !== null) {
			AnimationFrame.cancel(this.id)
			this.id = null
		}
		
		this.canceled = true
	}
}

/** Repeated animation frames, call `fn` at every animation frame time. */
export function frameLoop(fn: FrameLoopCallback): () => void {
	let l = new FrameLoop(fn)
	l.start()

	return l.cancel.bind(l)
}



/** Throttle `fn` calling frequency, call original at most once every `intervalMs`. */
export class Throttle<F extends Function> extends WrappedTimeControlFunction<F> {

	/** At `immediateMode`, will call original function immediately. */
	readonly immediateMode: boolean

	/** Cached function, with parameters bound. */
	private boundFn: F | null = null

	/** 
	 * If `immediateMode` is `true`, will call original function immediately.
	 * Otherwise will call original function deferred and smoothly.
	 */
	constructor(fn: F, ms: number = 200, immediateMode: boolean = false) {
		super(fn, ms)
		this.immediateMode = immediateMode
	}

	/** Whether throttle is running. */
	get running(): boolean {
		return !this.canceled
	}

	protected wrap() {
		let me = this

		return function(this: any, ...args: any) {

			// No throttle.
			if (me.canceled) {
				me.fn.apply(this, args)
				return
			}

			// Be throttled.
			if (me.id !== null) {
				return
			}

			// Do throttle.
			me.setThrottle(this, args)
		} as unknown as F
	}

	private setThrottle(scope: any, args: any[]) {
		if (this.immediateMode) {
			this.fn.apply(scope, args)
		}
		else {
			this.boundFn = this.fn.bind(scope, ...args)
		}

		this.id = setTimeout(this.onTimeout.bind(this), this.ms)
	}

	private onTimeout() {
		this.id = null

		if (this.boundFn) {
			this.boundFn()
			this.boundFn = null
		}
	}

	/** 
	 * Reset throttle timeout,
	 * Will restart throttle timeout when next time calling `fn` and calls `fn` immediately.
	 * Will exit canceled state.
	 */
	reset() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
		}

		this.boundFn = null
		this.canceled = false
	}

	/** Call `fn` immediately and reset throttle timeout. */
	flush() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
		}

		if (this.boundFn) {
			this.boundFn()
			this.boundFn = null
		}

		this.reset()
	}

	/** Cancel throttle, `fn` will be called without limitation. */
	cancel() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
		}

		this.boundFn = null
		this.canceled = true
	}
}

/** 
 * Throttle `fn` calling frequency, call original at most once every `intervalMs`.
 * If `immediateMode` is `true`, will call original function immediately.
 * Otherwise will call original function deferred and smoothly.
 */
export function throttle<F extends Function>(fn: F, ms: number = 200, immediateMode: boolean = false): F {
	return new Throttle(fn, ms, immediateMode).wrapped
}



/** 
 * Debounce `fn` calling frequency,
 * call `fn` after called before and not calling returned function for at least `intervalMs` duration.
 */
export class Debounce<F extends Function> extends WrappedTimeControlFunction<F> {

	/** Cached function, to call it when time meet. */
	private boundFn: F | null = null

	/** Whether debounce is running. */
	get running(): boolean {
		return !this.canceled
	}

	protected wrap(): F {
		let me = this

		return function(this: any, ...args: any) {

			// No debounce.
			if (me.canceled) {
				me.fn.apply(this, args)
				return
			}
			
			// Clear exist.
			if (me.id !== null) {
				clearTimeout(me.id)
			}
			
			// Start new timeout.
			me.setDebounce(this, args)
		} as unknown as F
	}

	private setDebounce(scope: any, args: any[]) {
		this.boundFn = this.fn.bind(scope, ...args)
		this.id = setTimeout(this.onTimeout.bind(this), this.ms)
	}

	private onTimeout() {
		this.id = null
		this.boundFn!()
		this.boundFn = null
	}

	/** 
	 * Reset debounce timeout and discard deferred calling.
	 * Will exit canceled state.
	 */
	reset() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
			this.boundFn = null
		}

		this.canceled = false
	}

	/** Call `fn` immediately if there is a deferred calling, and restart debounce timeout. */
	flush() {
		if (this.boundFn) {
			this.boundFn()
		}

		this.reset()
	}

	/**
	 * Cancel debounce, `fn` will be called without limitation.
	 * Returns `true` if is not canceled before.
	 */
	cancel() {
		this.canceled = true
	}
}

/** 
 * Debounce `fn` calling frequency,
 * call `fn` after called before and not calling returned function for at least `intervalMs` duration.
 */
export function debounce<F extends Function> (fn: F, ms: number): F {
	return new Debounce(fn, ms).wrapped
}
