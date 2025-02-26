/** 
 * Bundle all added data items into one during a micro task.
 * Can be used to bundle callback parameter to a group,
 * and calls with it as parameters for at most once in one micro task.
 * 
 * If `delay` set, use timeout with delay as timeout milliseconds.
 */
abstract class Bundler<T, I extends Iterable<T>> {

	protected abstract bundled: I
	protected callback: (list: I) => Promise<void> | void
	protected started: boolean = false

	/** Delay in milliseconds to trigger callback. */
	delay: number = 0

	constructor(callback: (list: I) => Promise<void> | void) {
		this.callback = callback
	}

	/** Add one parameter to bundler parameters. */
	add(param: T) {
		this.addItemOnly(param)

		if (this.started) {
			return
		}

		if (this.delay > 0) {
			setTimeout(this.fireBundled.bind(this), this.delay)
		}
		else {
			Promise.resolve().then(() => {
				this.fireBundled()
			})
		}

		this.started = true
	}

	protected abstract addItemOnly(item: T): void

	protected async fireBundled() {
		await this.callback(this.bundled)
		this.started = false
	}
}


/** 
 * Bundle all added data items into a list during a micro task.
 * Callback with bundled list as parameter for at most once in one micro task.
 */
export class ListBundler<T = any> extends Bundler<T, T[]> {

	protected bundled: T[] = []

	/** Add one item. */
	protected addItemOnly(item: T) {
		this.bundled.push(item)
	}
}


/** 
 * Bundle all added data items into a set during a micro task.
 * Callback with bundled set as parameter for at most once in one micro task.
 */
export class SetBundler<T = any> extends Bundler<T, Set<T>> {

	protected bundled: Set<T> = new Set()

	/** Add one item. */
	protected addItemOnly(item: T) {
		this.bundled.add(item)
	}
}


/** 
 * Callback for at most once in one micro task.
 * Ignore all added data items, just callback.
 */
export class EmptyBundler {

	protected callback: () => Promise<void> | void
	protected started: boolean = false

	/** Delay in milliseconds to trigger callback. */
	delay: number = 0

	constructor(callback: () => Promise<void> | void) {
		this.callback = callback
	}

	/** Start a delayed callback if not yet. */
	call() {
		if (this.started) {
			return
		}

		if (this.delay > 0) {
			setTimeout(this.fireBundled.bind(this), this.delay)
		}
		else {
			Promise.resolve().then(() => {
				this.fireBundled()
			})
		}

		this.started = true
	}

	protected async fireBundled() {
		await this.callback()
		this.started = false
	}
}