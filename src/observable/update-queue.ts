import {MiniHeap} from '../structs'
import {AnimationFrame} from '../tools'
import {bindCallback} from './helpers/bind-callback'


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
		let bindedCallback = bindCallback(callback, scope)

		this.heap.add({
			callback: bindedCallback,
			order,
		})

		this.set.add(bindedCallback)
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


/** Enqueue updatable objects, later update them in order. */
export namespace UpdateQueue{

	/** Caches all callbacks in order. */
	const heap: UpdateHeap = new UpdateHeap()

	/** Callbacks wait to be called after all the things update. */
	let completeCallbacks: (() => void)[] = []

	/** What's updating right now. */
	let phase: QueueUpdatePhase = QueueUpdatePhase.NotStarted


	/** 
	 * Enqueue a callback with a scope, will call it before the next animate frame.
	 * Multiple times add same callbacks during same animate frame will work for only once.
	 * `order` specifies the callback order.
	 */
	export function enqueue(callback: () => void, scope: object | null = null, order: number = 0) {
		if (heap.has(callback, scope)) {
			return
		}

		heap.add(callback, scope, order)
		willUpdateIfNotYet()
	}


	/** Calls `callback` after all the enqueued callbacks were called. */
	export function onComplete(callback: () => void) {
		completeCallbacks.push(callback)
		willUpdateIfNotYet()
	}


	/** Returns a promise which will be resolved after all the enqueued callbacks were called. */
	export function untilComplete(): Promise<void> {
		return new Promise(resolve => {
			onComplete(resolve)
		})
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

		while (!heap.isEmpty() || completeCallbacks.length > 0) {
			while (!heap.isEmpty()) {
				do {
					let callback = heap.shift()!

					try {
						callback()
					}
					catch (err) {
						console.error(err)
					}
				}
				while (!heap.isEmpty())
			}

			let oldCallbacks = completeCallbacks
			completeCallbacks = []

			// Calls callbacks, all components and watchers become stable now.
			for (let callback of oldCallbacks) {
				try {
					callback()
				}
				catch (err) {
					console.error(err)
				}
			}

			// Wait for a micro task tick.
			await Promise.resolve()
		}

		// Back to start stage.
		phase = QueueUpdatePhase.NotStarted
	}
}