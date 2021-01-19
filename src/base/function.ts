abstract class TimingFunction {
	
	protected id: any = null

	/** Whether current timing function has been canceled. */
	canceled: boolean = false

	/** The original function. */
	fn: Function

	/** Get or set the associated time interval in milliseconds. */
	ms: number

	constructor(fn: Function, ms: number) {
		this.fn = fn
		this.ms = ms
	}

	abstract reset(): boolean
	abstract flush(): boolean
	abstract cancel(): boolean
}


abstract class WrappedTimingFunction<F extends Function> extends TimingFunction {

	/** The wrapped function. */
	wrapped: F & {__original: F}

	constructor(fn: F, ms: number) {
		super(fn, ms)
		this.wrapped = this.wrap() as  F & {__original: F}

		// To track original handler so that we can unregister the wrapped function in event listener.
		this.wrapped.__original = fn
	}

	protected abstract wrap(): F
}


export class Timeout extends TimingFunction {

	constructor(fn: Function, ms: number) {
		super(fn, ms)
		this.reset()
	}

	/** Restart timeout, although it was called. */
	reset(): true {
		if (this.id) {
			clearTimeout(this.id)
		}

		this.id = setTimeout(this.onTimeout.bind(this), this.ms)

		return true
	}

	private onTimeout() {
		this.id = null
		this.fn()
	}

	/** 
	 * Call deferred function immediately if it wasn't been called.
	 * Returns `true` if not called yet.
	 */
	flush(): boolean {
		if (!this.id) {
			return false
		}

		clearTimeout(this.id)
		this.id = null
		this.fn()

		return true
	}

	/** 
	 * Cancel deferred function.
	 * Returns `true` if it was not been canceled.
	 */
	cancel(): boolean {
		if (!this.id) {
			return false
		}

		clearTimeout(this.id)
		this.id = null

		return true
	}
}

/**
 * Just like `setTimeout`, call `fn` after `ms` millisecons.
 * @param fn The function to call later.
 * @param ms The timeout time in millisecons.
 */
export function timeout(fn: Function, ms: number = 0): Timeout {
	return new Timeout(fn, ms)
}


export class Interval extends TimingFunction {

	constructor(fn: Function, ms: number) {
		super(fn, ms)
		this.reset()
	}

	/** Restart interval, although it was canceled. */
	reset(): true {
		if (this.id) {
			clearInterval(this.id)
		}

		this.id = setInterval(this.onInterval.bind(this), this.ms)

		return true
	}

	private onInterval() {
		this.fn()
	}

	/** Call interval function immediately if it wasn't canceled. returns whether it was not benn canceled. */
	flush(): boolean {
		if (!this.id) {
			return false
		}

		this.fn()
		this.reset()

		return true
	}

	/** 
	 * Cancel interval function.
	 * Returns `true` if it was not been canceled.
	 */
	cancel(): boolean {
		if (!this.id) {
			return false
		}

		clearInterval(this.id)
		this.id = null

		return true
	}
}

/**
 * Just like `setInterval`, call `fn` every `ms` millisecons.
 * @param fn The function to call.
 * @param ms The interval time in millisecons.
 */
export function interval(fn: Function, ms: number): Interval {
	return new Interval(fn, ms)
}


export class Throttle<F extends Function> extends WrappedTimingFunction<F> {

	protected wrap() {
		let me = this

		return function(this: any, ...args: any) {
			if (me.canceled) {
				me.fn.apply(this, args)
				return
			}
			
			if (!me.id) {
				me.setThrottle()
				me.fn.apply(this, args)
			}
		} as unknown as F
	}

	private setThrottle() {
		if (this.ms) {
			this.id = setTimeout(this.onTimeout.bind(this), this.ms)
		}
		else {
			this.id = requestAnimationFrame(this.onTimeout.bind(this))
		}
	}

	private onTimeout() {
		this.id = null
	}

	/** Reset throttle timeout, Will restart throttle timeout when next time calling `fn` and calls `fn` immediately. */
	reset(): true {
		if (this.id) {
			this.clearThrottle()
		}

		this.canceled = false

		return true
	}

	private clearThrottle() {
		if (this.ms) {
			clearTimeout(this.id)
		}
		else {
			cancelAnimationFrame(this.id)
		}
		
		this.id = null
	}

	/** Call `fn` immediately and reset throttle timeout. */
	flush(): true {
		this.reset()
		this.fn()

		return true
	}

	/** 
	 * Cancel throttle, function will be called without limit.
	 * Returns `true` if is not canceled before.
	 */
	cancel(): boolean {
		if (this.canceled) {
			return false
		}

		this.canceled = true

		return true
	}
}

/**
 * Throttle function calls, `fn` will not be called for twice in each `ms` millisecons
 * Note that it doesn't ensure the last calling.
 * @param fn The function to throttle.
 * @param ms The time period in which allows at most one calling. If omitted, uses `requestAnimationFrame` to throttle.
 */
export function throttle<F extends Function>(fn: F, ms: number = 0): Throttle<F> {
	return new Throttle(fn, ms)
}


export class SmoothThrottle<F extends Function> extends WrappedTimingFunction<F> {
	
	private lastArgs: any[] | null = null
	private lastThis: any = null

	protected wrap(): F {
		let me = this
		
		return function(this: any, ...args: any) {
			if (me.canceled) {
				me.fn.apply(this, args)
				return
			}
	
			me.lastArgs = args
			me.lastThis = this
	
			if (!me.id) {
				me.setThrottle()
			}
		} as unknown as F
	}

	private setThrottle() {
		if (this.ms) {
			this.id = setTimeout(this.onTimeout.bind(this), this.ms)
		}
		else {
			this.id = requestAnimationFrame(this.onTimeout.bind(this))
		}
	}

	private onTimeout() {
		if (this.lastArgs) {
			this.fn.apply(this.lastThis, this.lastArgs)
			this.lastArgs = null
			this.lastThis = null
			this.setThrottle()
		}
		else {
			this.id = null
		}
	}

	/** Reset throttle timeout and discard deferred calling, will restart throttle if been canceled. */
	reset(): true {
		if (this.id) {
			this.clearThrottle()
		}

		this.lastArgs = null
		this.lastThis = null
		this.canceled = false

		return true
	}

	/** Call function immediately if there is a deferred calling, and restart throttle timeout. */
	flush(): boolean {
		if (this.lastArgs) {
			this.setThrottle()
			this.fn.apply(this.lastThis, this.lastArgs)
			this.lastArgs = null
			this.lastThis = null

			return true
		}

		return false
	}

	private clearThrottle() {
		if (this.ms) {
			clearTimeout(this.id)
		}
		else {
			cancelAnimationFrame(this.id)
		}
		
		this.id = null
	}

	/**
	 * Cancel throttle, function will be called without limit.
	 * Returns `true` if is not canceled before.
	 */
	cancel(): boolean {
		if (this.canceled) {
			return false
		}

		this.canceled = true

		return true
	}
}

/**
 * Throttle function calls, `fn` will not be called for twice in each `ms` millisecons.
 * Different from `ff.throttle`, `fn` will be called lazily and smooth, and it ensures the last calling.
 * @param fn The function to throttle.
 * @param ms The time period which allows at most one calling. If omitted, uses `requestAnimationFrame` to throttle.
 */
export function smoothThrottle<F extends Function>(fn: F, ms: number): SmoothThrottle<F> {
	return new SmoothThrottle(fn, ms)
}


export class Debounce<F extends Function> extends WrappedTimingFunction<F> {

	private lastArgs: any[] | null = null
	private lastThis: any = null

	protected wrap(): F {
		let me = this

		return function(this: any, ...args: any) {
			if (me.canceled) {
				me.fn.apply(this, args)
				return
			}
	
			if (me.id) {
				clearTimeout(me.id)
			}
	
			me.id = setTimeout(me.onTimeout.bind(me), me.ms)
			me.lastArgs = args
			me.lastThis = this
		} as unknown as F
	}

	private onTimeout() {
		this.id = null

		if (this.lastArgs) {
			this.fn.apply(this.lastThis, this.lastArgs)
			this.lastArgs = null
			this.lastThis = null
		}
	}

	/** Reset debounce timeout and discard deferred calling, will restart debounce if been canceled. */
	reset(): true {
		if (this.id) {
			clearTimeout(this.id)
			this.id = null
		}
		
		this.lastArgs = null
		this.lastThis = null

		return true
	}

	/** Call function immediately if there is a deferred calling, and restart debounce timeout. */
	flush(): boolean {
		if (this.id) {
			clearTimeout(this.id)
			this.id = 0
		}

		if (this.lastArgs) {
			this.fn.apply(this.lastThis, this.lastArgs)
			this.lastArgs = null
			this.lastThis = null

			return true
		}

		return false
	}

	/**
	 * Cancel debounce, function will be called without limit.
	 * Returns `true` if is not canceled before.
	 */
	cancel(): boolean {
		if (this.canceled) {
			return false
		}

		this.canceled = true
		return true
	}
}

/**
 * Debounce function calls, calls returned function continuously in a short time will pause calling `fn`.
 * It can be used to only send search request after user stops inputting.
 * @param fn The function to debounce.
 * @param ms The timeout in milliseconds.
 */
export function debounce<F extends Function> (fn: F, ms: number): Debounce<F> {
	return new Debounce(fn, ms)
}
