/** 
 * Bundle several data items into one,
 * Can be used to bundle callback parameter to a group,
 * and calls for at most once in one micro task tick.
 */
abstract class Bundler<T, I extends Iterable<T>> {

	protected abstract bundled: I
	protected callback: (list: I) => void
	protected started: boolean = false

	constructor(callback: (list: I) => void) {
		this.callback = callback
	}

	/** Add one parameter to bundler. */
	add(param: T) {
		this.addItemOnly(param)

		if (!this.started) {
			Promise.resolve().then(() => {
				this.fireBundled()
			})

			this.started = true
		}
	}

	protected abstract addItemOnly(item: T): void

	protected fireBundled() {
		this.callback(this.bundled)
		this.started = false
	}
}


/** 
 * Bundle several data items into a list,
 * Callback with bundled list as parameter for at most once in one micro task tick.
 */
export class ListBundler<T = any> extends Bundler<T, T[]> {

	protected bundled: T[] = []

	/** Add one item. */
	protected addItemOnly(item: T) {
		this.bundled.push(item)
	}
}


/** 
 * Bundle several data items into a set,
 * Callback with bundled set as parameter for at most once in one micro task tick.
 */
export class SetBundler<T = any> extends Bundler<T, Set<T>> {

	protected bundled: Set<T> = new Set()

	/** Add one item. */
	protected addItemOnly(item: T) {
		this.bundled.add(item)
	}
}


/** Callback for at most once in one micro task tick. */
export class CallbackBundler {

	protected callback: () => void
	protected started: boolean = false

	constructor(callback: () => void) {
		this.callback = callback
	}

	/** Start delayed callback if not yet. */
	call() {
		if (!this.started) {
			Promise.resolve().then(() => {
				this.fireBundled()
			})

			this.started = true
		}
	}

	protected fireBundled() {
		this.callback()
		this.started = false
	}
}