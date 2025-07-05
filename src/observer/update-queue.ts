import {MiniHeap} from '../structs'
import {AnimationFrame, bindCallback, promiseWithResolves} from '../utils'


/** Indicates queue update phase. */
enum QueueUpdatePhase {

	/** Nothing to update. */
	NotStarted,

	/** Will update in next animation frame. */
	Prepended,

	/** Are updating, back to `NotStarted` after ended. */
	Updating,
}


/** Caches things that need to be update. */
class UpdateHeap {
	
	/** Cache existed callbacks. */
	private set: Set<Function> = new Set()

	/** Dynamically sorted callbacks. */
	private heap: MiniHeap<{callback: Function, order: number}>

	constructor() {
		this.heap = new MiniHeap(function(a, b) {
			return a.order - b.order
		})
	}

	isEmpty() {
		return this.heap.isEmpty()
	}

	has(callback: Function, scope: object | null): boolean {
		return this.set.has(bindCallback(callback, scope))
	}

	add(callback: Function, scope: object | null, order: number) {
		let boundCallback = bindCallback(callback, scope)

		this.heap.add({
			callback: boundCallback,
			order,
		})

		this.set.add(boundCallback)
	}

	shift() {
		let {callback} = this.heap.popHead()!
		this.set.delete(callback)
		
		return callback
	}

	clear() {
		this.set = new Set()
		this.heap.clear()
	}
}


/** Caches all callbacks in order. */
const heap: UpdateHeap = new UpdateHeap()

/** Callbacks wait to be called after all the things update. */
let updateCompleteCallbacks: (() => void)[] = []

/** What's updating right now. */
let phase: QueueUpdatePhase = QueueUpdatePhase.NotStarted


/** 
 * Enqueue a callback with a scope, will call it before the next animate frame.
 * Note you must prevent adding same callback multiple times before updating.
 * E.g., you may implement a `needsUpdate` property, and avoid enqueuing if it's `true`.
 * 
 * `order` specifies the callback order, default value is `0`.
 * 	 Normally for component, it's the iid of this component.
 */
export function enqueueUpdate(callback: () => void, scope: object | null = null, order: number = 0) {
	heap.add(callback, scope, order)
	willUpdateIfNotYet()
}


/** 
 * Enqueue a callback with a scope, will call it before all enqueued callbacks
 * with order `0` have been called, normally watchers / effectors / computers.
 * All component updates have not started yet.
 */
export function enqueueAfterDataApplied(callback: () => void, scope: object | null = null) {
	heap.add(callback, scope, 0.5)
	willUpdateIfNotYet()
}


/** 
 * Returns a promise which will be resolved after all the enqueued callbacks were called.
 * Can safely read computed style and rendered properties after promise resolved.
 * Normally you should wait for updating complete before reading any dom property.
 */
export function untilUpdateComplete(): Promise<void> {
	let {promise, resolve} = promiseWithResolves()
	updateCompleteCallbacks.push(resolve)
	willUpdateIfNotYet()
	
	return promise
}


/** Enqueue a update task if not have. */
function willUpdateIfNotYet() {
	if (phase === QueueUpdatePhase.NotStarted) {
		AnimationFrame.requestCurrent(update)
		phase = QueueUpdatePhase.Prepended
	}
}


/** Do updating. */
async function update() {
	phase = QueueUpdatePhase.Updating

	try {
		while (!heap.isEmpty() || updateCompleteCallbacks.length > 0) {
			while (!heap.isEmpty()) {
				do {
					let callback = heap.shift()!
					callback()
				}
				while (!heap.isEmpty())
			}

			let callbacks = updateCompleteCallbacks
			updateCompleteCallbacks = []

			// Calls callbacks, all components and watchers become stable now.
			for (let callback of callbacks) {
				callback()
			}

			// Wait for a micro task to see if more callbacks come.
			await Promise.resolve()

			// Wait for those very deep micro tasks to be completed.
			// Bad part is it may postpone callback to next frame.
			// await sleep(0)
		}
	}
	catch (err) {
		console.error(err)
	}

	// Back to start stage.
	phase = QueueUpdatePhase.NotStarted
}