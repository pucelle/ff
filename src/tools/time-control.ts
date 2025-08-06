/** 
 * Class mode of `setTimeout`.
 * Note it doesn't start automatically.
 */
export class Timeout<F extends Function = Function> {

	/** 
	 * Whether current time control has been canceled.
	 * Readonly outside.
	 */
	canceled: boolean = false

	/** The original function to call after timeout. */
	fn: F

	/** Get or set the associated time in milliseconds. */
	ms: number

	/** Timeout id, `null` represents it's not exist. */
	protected id: any = null

	constructor(fn: F, ms: number) {
		this.fn = fn
		this.ms = ms
	}

	/** Whether timeout is running. */
	get running(): boolean {
		return !!this.id
	}

	/** Restart timeout, even a called or canceled Timeout can be restarted. */
	reset() {
		if (this.id !== null) {
			clearTimeout(this.id)
		}

		this.id = setTimeout(this.onTimeout.bind(this), this.ms)
		this.canceled = false
	}

	/** Start or restart timeout, even a called or canceled Timeout can be restarted. */
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
 * Class mode of `setInterval`.
 * Note it doesn't start automatically.
 */ 
export class Interval<F extends Function = Function> {

	/** 
	 * Whether current time control has been canceled.
	 * Readonly outside.
	 */
	canceled: boolean = false

	/** The original function to call each interval. */
	fn: F

	/** Get or set the associated time interval in milliseconds. */
	ms: number

	/** Interval id, `null` represents it's not exist. */
	protected id: any = null

	constructor(fn: F, ms: number) {
		this.fn = fn
		this.ms = ms
	}

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



/** Throttle `fn` calling frequency, call original at most once every `intervalMs`. */
export class Throttle<F extends Function> {

	/** 
	 * Whether current time control has been canceled.
	 * Readonly outside.
	 */
	canceled: boolean = false

	/** The original function to call after each throttle interval. */
	fn: F

	/** Get or set the associated throttle time in milliseconds. */
	ms: number

	/** 
	 * The wrapped function that after throttled.
	 * Readonly outside.
	 */
	wrapped: F

	/** Interval id, `null` represents it's not exist. */
	protected id: any = null

	/** At `immediateMode`, will call original function immediately. */
	readonly immediateMode: boolean

	/** Cached function, with parameters bound. */
	private boundFn: F | null = null

	/** 
	 * If `immediateMode` is `true`, will call original function immediately.
	 * Otherwise will call original function deferred and smoothly.
	 */
	constructor(fn: F, ms: number = 200, immediateMode: boolean = false) {
		this.fn = fn
		this.ms = ms
		this.wrapped = this.wrap()
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
 * Debounce `fn` calling frequency,
 * call `fn` after called before and not calling returned function for at least `intervalMs` duration.
 */
export class Debounce<F extends Function> {

	/** 
	 * Whether current time control has been canceled.
	 * Readonly outside.
	 */
	canceled: boolean = false

	/** The original function to call after debounce end. */
	fn: F

	/** Get or set the associated debounce time in milliseconds. */
	ms: number

	/** 
	 * The wrapped function that after debounced.
	 * Readonly outside.
	 */
	wrapped: F
	
	/** Interval id, `null` represents it's not exist. */
	protected id: any = null

	/** Cached function, to call it when time meet. */
	private boundFn: F | null = null

	constructor(fn: F, ms: number = 200) {
		this.fn = fn
		this.ms = ms
		this.wrapped = this.wrap()
	}

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
