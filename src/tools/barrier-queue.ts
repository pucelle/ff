import {MiniHeap, promiseWithResolves, untilUpdateComplete} from '@pucelle/lupos'


/** State of BarrierQueue. */
const enum BarrierQueueState {
	Pending,
	WillResolve,
	Resolving,
}

const enum BarrierQueueOrder {
	WillReadDOM = 0,
	WillWriteDOM = 1,
}


/** 
 * Can enqueue to request with a `step` parameter and get a promise.
 * Later same stepped promises will be resolved one time,
 * and all promises will be resolved in the order of `step`.
 */
class BarrierQueue {

	/** Caches step -> resolve function list. */
	private map: Map<BarrierQueueOrder, {promise: Promise<void>, resolve: Function}> = new Map()

	/** Can dynamically insert items and order them to get the minimum one. */
	private heap: MiniHeap<BarrierQueueOrder>

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
	barrier(step: BarrierQueueOrder): Promise<void> {
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
	private async resolve() {
		if (this.state !== BarrierQueueState.WillResolve) {
			return
		}

		this.state = BarrierQueueState.Resolving

		while (!this.isEmpty()) {
			await this.resolveLatestStep()

			// Wait for more next stepped barriers come.
			await Promise.resolve()
			await Promise.resolve()
		}

		this.state = BarrierQueueState.Pending
	}

	/** Resolves latest stepped barrier. */
	private async resolveLatestStep() {
		let step = this.heap.popHead()!
		let {resolve} = this.map.get(step)!

		// Wait for all updating complete.
		if (step === BarrierQueueOrder.WillReadDOM) {
			await untilUpdateComplete()
		}

		this.map.delete(step)
		resolve()
	}

	/** Clear all items from barrier queue. */
	clear() {
		this.map = new Map()
		this.heap.clear()
	}
}


const queue = /*#__PURE__*/new BarrierQueue()

/** 
 * Enqueue to request and get a promise,
 * which will be resolved after can read DOM properties.
 * 
 * Normal situation:
 * READ1
 * WRITE1
 * READ2
 * WRITE2
 * 
 * By barrier queue:
 * await barrierDOMReading()
 * READ1
 * await barrierDOMWriting()
 * WRITE1
 * ...
 * 
 * =>
 * READ1
 * READ2
 * WRITE1
 * WRITE2
 */
export function barrierDOMReading() {
	return queue.barrier(BarrierQueueOrder.WillReadDOM)
}

/** 
 * Enqueue to request and get a promise,
 * which will be resolved after can write DOM properties.
 * 
 * Normal situation:
 * READ1
 * WRITE1
 * READ2
 * WRITE2
 * 
 * By barrier queue:
 * await barrierDOMReading()
 * READ1
 * await barrierDOMWriting()
 * WRITE1
 * ...
 * 
 * =>
 * READ1
 * READ2
 * WRITE1
 * WRITE2
 */
export function barrierDOMWriting() {
	return queue.barrier(BarrierQueueOrder.WillWriteDOM)
}
