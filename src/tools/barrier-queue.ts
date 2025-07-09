import {MiniHeap, promiseWithResolves} from '@pucelle/lupos'


/** State of BarrierQueue. */
enum BarrierQueueState {
	Pending,
	WillResolve,
	Resolving,
}


/** 
 * Can enqueue to request with a `step` parameter and get a promise.
 * Later same stepped promises will be resolved one time,
 * and all promises will be resolved in the order of `step`.
 */
export class BarrierQueue {

	/** Caches step -> resolve function list. */
	private map: Map<number, {promise: Promise<void>, resolve: Function}> = new Map()

	/** Can dynamically insert items and order them to get the minimum one. */
	private heap: MiniHeap<number>

	/** Current state. */
	private state: BarrierQueueState = BarrierQueueState.Pending

	constructor() {
		this.heap = new MiniHeap(function(a, b) {
			return a - b
		})
	}

	/** Whether current queue is empty. */
	isEmpty() {
		return this.heap.isEmpty()
	}

	/** Make a barrier promise, with `step` to sort. */
	barrier(step: number): Promise<void> {
		if (this.map.has(step)) {
			return this.map.get(step)!.promise
		}

		let {promise, resolve} = promiseWithResolves()

		this.map.set(step, {
			promise,
			resolve: resolve!,
		})

		this.heap.add(step)
		this.willResolve()

		return promise
	}

	/** Ensure will resolve in the next micro task. */
	private async willResolve() {
		if (this.state === BarrierQueueState.Pending) {
			this.state = BarrierQueueState.WillResolve
			
			await Promise.resolve()
			this.resolve()
		}
	}

	/** Resolves all barriers in the order of barrier step. */
	async resolve() {
		if (this.state !== BarrierQueueState.WillResolve) {
			return
		}

		this.state = BarrierQueueState.Resolving

		while (!this.isEmpty()) {
			await this.resolveLatestStep()

			// Wait for more next stepped barriers come.
			await Promise.resolve()
		}

		this.state = BarrierQueueState.Pending
	}

	/** Resolves latest stepped barrier. */
	private async resolveLatestStep() {
		let step = this.heap.popHead()!
		let {resolve} = this.map.get(step)!

		this.map.delete(step)
		resolve()
	}

	/** Clear all items from queue. */
	clear() {
		this.map = new Map()
		this.heap.clear()
	}
}
