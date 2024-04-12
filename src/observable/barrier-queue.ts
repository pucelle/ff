import {MiniHeap} from '../structs'


/** 
 * `enqueue` to request with a `step` parameter and get a promise.
 * Later same stepped promises will be resolved one time,
 * and all promises will be resolved in order of `step`.
 */
export class BarrierQueue {

	/** Caches step -> resolve function list. */
	private map: Map<number, {promise: Promise<void>, resolve: Function}> = new Map()

	/** Dynamically inserting items and order them to get the minimum one. */
	private heap: MiniHeap<number>

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

		let resolve: Function

		let promise = new Promise(function(r) {
			resolve = r
		}) as Promise<void>

		this.map.set(step, {
			promise,
			resolve: resolve!,
		})

		this.heap.add(step)

		return promise
	}

	/** Resolves all barriers order by step. */
	async resolve() {
		while (!this.isEmpty()) {
			await this.resolveLatestStep()

			// Wait for more next stepped barriers come.
			await Promise.resolve()
		}
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
