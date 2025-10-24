import {Timeout} from './time-control'


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
	protected timeout: Timeout
	protected paused: boolean = false

	/** Delay in milliseconds to trigger callback. */
	delay: number = 0

	constructor(callback: (list: I) => Promise<void> | void) {
		this.callback = callback
		this.timeout = new Timeout(this.fireBundled.bind(this), this.delay)
	}

	/** Add one parameter to bundler parameters. */
	add(...items: T[]) {
		if (items.length === 0) {
			return
		}

		this.addItems(...items)

		if (!this.paused) {
			this.resetTimeoutIfNot()
		}
	}

	protected resetTimeoutIfNot() {
		if (!this.timeout.running) {
			this.timeout.ms = this.delay
			this.timeout.start()
		}
	}

	/** Pause bundled firing. */
	pause() {
		this.timeout?.cancel()
		this.paused = true
	}

	/** Resume bundled firing. */
	resume() {
		if (this.hasItems()) {
			this.resetTimeoutIfNot()
		}
		this.paused = false
	}

	/** Add some items. */
	protected abstract addItems(...items: T[]): void

	/** Whether has any item. */
	protected abstract hasItems(): boolean

	protected async fireBundled() {
		await this.callback(this.bundled)
		this.clear()
	}

	/** Clear collected bundled. */
	abstract clear(): void
}


/** 
 * Bundle all added data items into a list during a micro task.
 * Callback with bundled list as parameter for at most once in one micro task.
 */
export class ListBundler<T = any> extends Bundler<T, T[]> {

	protected bundled: T[] = []

	protected addItems(...items: T[]) {
		this.bundled.push(...items)
	}

	protected hasItems(): boolean {
		return this.bundled.length > 0
	}

	clear() {
		this.bundled = []
	}
}


/** 
 * Bundle all added data items into a set during a micro task.
 * Callback with bundled set as parameter for at most once in one micro task.
 */
export class SetBundler<T = any> extends Bundler<T, Set<T>> {

	protected bundled: Set<T> = new Set()

	protected addItems(...items: T[]) {
		for (let item of items) {
			this.bundled.add(item)
		}
	}

	protected hasItems(): boolean {
		return this.bundled.size > 0
	}

	clear() {
		this.bundled.clear()
	}
}


/** 
 * Callback for at most once in one micro task.
 * Ignore all added data items, just callback.
 */
export class EmptyBundler {

	protected callback: () => Promise<void> | void
	protected timeout: Timeout
	protected needToCall: boolean = false
	protected paused: boolean = false

	/** Delay in milliseconds to trigger callback. */
	delay: number = 0

	constructor(callback: () => Promise<void> | void) {
		this.callback = callback
		this.timeout = new Timeout(this.fireBundled.bind(this), this.delay)
	}

	/** Start a delayed callback if not yet. */
	call() {
		this.needToCall = true

		if (!this.paused) {
			this.resetTimeoutIfNot()
		}
	}

	protected resetTimeoutIfNot() {
		if (!this.timeout.running) {
			this.timeout.ms = this.delay
			this.timeout.start()
		}
	}

	/** Pause bundled firing. */
	pause() {
		this.timeout?.cancel()
		this.paused = true
	}

	/** Resume bundled firing. */
	resume() {
		if (this.needToCall) {
			this.resetTimeoutIfNot()
		}
		this.paused = true
	}

	protected async fireBundled() {
		await this.callback()
		this.needToCall = false
	}
}