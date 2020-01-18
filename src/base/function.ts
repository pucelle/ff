abstract class TimingFunction {
	
	protected id: any = null

	/** Returns if current timing function has been canceled. */
	canceled: boolean = false

	/** Returns the binded function. */
	fn: Function

	/** Get or set the associated time in milliseconds. You should `reset()` after set it. */
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

	/** Returns the wrapped function, which was throttled or debounced. */
	wrapped: F

	constructor(fn: F, ms: number) {
		super(fn, ms)
		this.wrapped = this.wrap()

		// To track original handler so that we can unregister the wrapped in event listener.
		;(this.wrapped as any).__original = fn
	}

	protected abstract wrap(): F
}


export class Timeout extends TimingFunction {

	/**
	 * Just like setTimeout, call `fn` after `ms` millisecons.
	 * @param fn The function to call later.
	 * @param ms The timeout time in millisecons.
	 */
	constructor(fn: Function, ms: number) {
		super(fn, ms)
		this.reset()
	}

	/** Restart timeout, although it was been called. always returns true. */
	reset(): boolean {
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

	/** Call deferred function immediately if it wasn't been called and returns true. otherwise returns false. */
	flush(): boolean {
		if (!this.id) {
			return false
		}

		clearTimeout(this.id)
		this.id = null
		this.fn()
		return true
	}

	/** Cancel deferred function, returns if it was canceled before been called. */
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

	/**
	 * Just like setInterval, call `fn` every `ms` millisecons.
	 * @param fn The function to call.
	 * @param ms The interval time in millisecons.
	 */
	constructor(fn: Function, ms: number) {
		super(fn, ms)
		this.reset()
	}

	/** Restart interval, although it was been canceled. always returns true. */
	reset(): boolean {
		if (this.id) {
			clearInterval(this.id)
		}

		this.id = setInterval(this.onInterval.bind(this), this.ms)
		return true
	}

	private onInterval() {
		this.fn()
	}

	/** Call interval function immediately if it wasn't been canceled and returns true. otherwise returns false. */
	flush(): boolean {
		if (!this.id) {
			return false
		}

		this.fn()
		this.reset()
		return true
	}

	/** Cancel interval function, returns if it was canceled before been called. */
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

	/**
	 * Throttle function calls, call returned function twice in `ms` millisecons will only call `fn` for once.
	 * Note that it doesn't ensure the last calling.
	 * @param fn The function to throttle.
	 * @param ms The time period in which only at most one call allowed. If omitted, using `requestAnimationFrame` to throttle.
	 */
	constructor(fn: F, ms: number = 0) {
		super(fn, ms)
	}

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

	/** Reset throttle timeout, function will be called immediately next time. Will restart throttle if been canceled. */
	reset(): boolean {
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

	/** Do nothing, always return false. */
	flush(): boolean {
		return false
	}

	/** Cancel throttle, function will be called without limit. Returns true if is not canceled before. */
	cancel(): boolean {
		if (this.canceled) {
			return false
		}

		this.canceled = true
		return true
	}
}

/**
 * Throttle function calls, call returned function for twice in `ms` milliseconds will only call `fn` for once.
 * It doesn't ensure the last calling.
 * @param fn The function to throttle.
 * @param ms The time period in which only at most one call allowed.
 */
export function throttle<F extends Function>(fn: F, ms: number = 0): Throttle<F> {
	return new Throttle(fn, ms)
}


export class LazilyThrottle<F extends Function> extends WrappedTimingFunction<F> {
	
	private lastArgs: any[] | null = null
	private lastThis: any = null

	/**
	 * Throttle function calls like `throttle`, but will calls `fn` lazily and smooth.
	 * It ensures the last calling.
	 * @param fn The function to throttle.
	 * @param ms The time period in which only at most one call allowed.
	 */
	constructor(fn: F, ms: number) {
		super(fn, ms)
		this.wrapped = this.wrap()
	}

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

	/** Reset throttle timeout and discard deferred call, Will restart throttle if been canceled. */
	reset(): boolean {
		if (this.id) {
			this.clearThrottle()
		}

		this.lastArgs = null
		this.lastThis = null
		this.canceled = false
		return true
	}

	/** Call function immediately if there is a deferred call, and restart throttle timeout. */
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

	/** Cancel throttle, function will be called without limit. Returns true if is not canceled before. */
	cancel(): boolean {
		if (this.canceled) {
			return false
		}

		this.canceled = true
		return true
	}
}

/**
 * Throttle function calls like `throttle`, but will call `fn` lazily and smooth.
 * It ensures the last calling.
 * @param fn The function to throttle.
 * @param ms The time period in which only at most one call allowed.
 */
export function lazilyThrottle<F extends Function>(fn: F, ms: number): LazilyThrottle<F> {
	return new LazilyThrottle(fn, ms)
}


export class Debounce<F extends Function> extends WrappedTimingFunction<F> {

	private lastArgs: any[] | null = null
	private lastThis: any = null

	/**
	 * Debounce function calls, call returned function will start a timeout to call `fn`,
	 * But call returned function for the second time in `ms` milliseconds will reset timeout.
	 * @param fn The function to debounce.
	 * @param ms The timeout in milliseconds.
	 */
	constructor(fn: F, ms: number) {
		super(fn, ms)
		this.wrapped = this.wrap()
	}

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

	/** Reset debounce timeout and discard deferred call. Will restart debounce if been canceled. */
	reset(): boolean {
		if (this.id) {
			clearTimeout(this.id)
			this.id = null
		}
		
		this.lastArgs = null
		this.lastThis = null
		return true
	}

	/** Call function immediately there is a deferred call, and restart debounce timeout. */
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

	/** Cancel debounce, function will be called without limit. Returns true if is not canceled before. */
	cancel(): boolean {
		if (this.canceled) {
			return false
		}

		this.canceled = true
		return true
	}
}

/**
 * Debounce function calls, call returned function will start a timeout to call `fn`,
 * But call returned function for the second time in `ms` milliseconds will reset timeout.
 * @param fn The function to debounce.
 * @param ms The timeout in milliseconds.
 */
export function debounce<F extends Function> (fn: F, ms: number): Debounce<F> {
	return new Debounce(fn, ms)
}
