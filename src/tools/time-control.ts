import {AnimationFrame} from './animation-frame'


/** Base class for Timeout, Interval... */
abstract class TimeControlFunction<F extends Function> {

	/** Timeout or Interval id, `null` means not exist. */
	protected id: any = null

	/** 
	 * Whether current timing function has been canceled.
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

	/** Whether is running. */
	get running(): boolean {
		return !!this.id
	}

	abstract start(): void
	abstract flush(): void
	abstract cancel(): void
}


/** Wrapped a function, throttle or debounce it. */
abstract class WrappedTimeControllFunction<F extends Function> extends TimeControlFunction<F> {

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

	/** 
	 * Restart timeout, even a called or canceled Timeout can be restarted.
	 * Note will call `fn` immediately if `ms` parameter is `0`.
	 */
	start() {
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
 * Just like `setTimeout`, call `fn` after `ms` millisecons.
 * Returns a cancel function.
 */
export function timeout(fn: Function, ms: number = 0): () => void {
	let t = new Timeout(fn, ms)
	t.start()
	
	return t.cancel.bind(t)
}



/** Class mode of `setInterval`. */ 
export class Interval<F extends Function = Function> extends TimeControlFunction<F> {

	/** Restart interval, even it was canceled before. */
	start() {
		if (this.id !== null) {
			clearInterval(this.id)
		}

		this.id = setInterval(this.onInterval.bind(this), this.ms)
		this.canceled = false
	}

	private onInterval() {
		this.fn()
	}

	/** Call interval function immediately and reset interval. */
	flush() {
		this.fn()
		this.start()
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


/** Just like `setInterval`, call `fn` every `ms` millisecons. */
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

	/** 
	 * Restart animation frame, even it was canceled before.
	 * Calls `fn` with duration parameter `0` immediately.
	 */
	start() {
		if (this.id !== null) {
			AnimationFrame.cancel(this.id)
		}

		this.id = AnimationFrame.requestCurrent(this.onFirstInterval.bind(this))
		this.canceled = false
		this.fn(0)
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
		this.start()
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
	let i = new FrameLoop(fn)
	i.start()

	return i.cancel.bind(i)
}



/** Throttle `fn` calling frequency, call original at most once every `intervalMs`. */
export class Throttle<F extends Function> extends WrappedTimeControllFunction<F> {

	/** At `immediateMode`, will call original function immediately. */
	readonly immediateMode: boolean

	/** Cached function, to call it when time meet. */
	private toCall: (() => void) | null = null

	/** 
	 * If `immediateMode` is `true`, will call original function immediately.
	 * Otherwise will call original function deferred and smoothly.
	 */
	constructor(fn: F, ms: number = 200, immediateMode: boolean = false) {
		super(fn, ms)
		this.immediateMode = immediateMode
	}

	protected wrap() {
		let me = this

		return function(this: any, ...args: any) {

			// No throttle.
			if (me.canceled) {
				me.fn.apply(this, args)
				return
			}

			// In throttle.
			if (me.id !== null) {
				return
			}

			// Do throttle.
			if (me.immediateMode) {
				me.setThrottle(this, args)
			}
		} as unknown as F
	}

	private setThrottle(scope: any, args: any[]) {
		if (this.immediateMode) {
			this.fn.apply(scope, args)
			this.id = setTimeout(this.onImmediateTimeout.bind(this), this.ms)
		}
		else {
			this.toCall = this.onUnImmediateTimeout.bind(this, scope, args)
			this.id = setTimeout(this.toCall, this.ms)
		}
	}

	private onImmediateTimeout() {
		this.id = null
	}

	private onUnImmediateTimeout(scope: any, args: any[]) {
		this.fn.apply(scope, args)
		this.id = null
		this.toCall = null
	}

	/** 
	 * Reset throttle timeout,
	 * Will restart throttle timeout when next time calling `fn` and calls `fn` immediately.
	 * Will disable canceled state.
	 */
	start() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
			this.toCall = null
		}

		this.canceled = false
	}

	/** Call `fn` immediately and reset throttle timeout. */
	flush() {
		if (this.toCall) {
			this.toCall()
		}

		this.start()
	}

	/** Cancel throttle, function will be called without limition. */
	cancel() {
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
export class Debounce<F extends Function> extends WrappedTimeControllFunction<F> {

	/** Cached function, to call it when time meet. */
	private toCall: (() => void) | null = null

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
		this.toCall = this.onTimeout.bind(scope, this, args)
		this.id = setTimeout(this.toCall, this.ms)
	}

	private onTimeout(scope: any, args: any[]) {
		this.fn.apply(scope, args)
		this.id = null
		this.toCall = null
	}

	/** 
	 * Reset debounce timeout and discard deferred calling.
	 * Will disable canceled state.
	 */
	start() {
		if (this.id !== null) {
			clearTimeout(this.id)
			this.id = null
			this.toCall = null
		}

		this.canceled = false
	}

	/** Call function immediately if there is a deferred calling, and restart debounce timeout. */
	flush() {
		if (this.toCall) {
			this.toCall()
		}

		this.start()
	}

	/**
	 * Cancel debounce, function will be called without limit.
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
