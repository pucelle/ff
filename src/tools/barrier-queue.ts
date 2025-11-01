import {promiseWithResolves, untilUpdateComplete} from '@pucelle/lupos'


/** State of BarrierQueue. */
const enum BarrierQueueState {
	Pending,
	WillResolve,
	Resolving,
}

const enum BarrierQueueStep {
	ReadDOM = 0,
	WriteDOM = 1,
}


/** 
 * Can enqueue to request with a `step` parameter and get a promise.
 * Later same stepped promises will be resolved one time,
 * and all promises will be resolved in the order of `step`.
 */
class BarrierQueue {

	/** Caches step -> resolve function list. */
	private list: ({promise: Promise<void>, resolve: Function} | undefined)[] = new Array(2)

	/** Current state. */
	private state: BarrierQueueState = BarrierQueueState.Pending

	/** Make a barrier promise, with `step` to sort. */
	barrier(step: BarrierQueueStep): Promise<void> {
		if (this.list[step]) {
			return this.list[step].promise
		}

		let {promise, resolve} = promiseWithResolves()

		this.list[step] = {
			promise,
			resolve: resolve!,
		}

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

		while (this.list[BarrierQueueStep.ReadDOM] || this.list[BarrierQueueStep.WriteDOM]) {
			for (let step of [BarrierQueueStep.ReadDOM, BarrierQueueStep.WriteDOM]) {
				if (!this.list[step]) {
					continue
				}

				await this.resolveStep(step)

				// Wait for more same stepped barriers come.
				await Promise.resolve()
				await Promise.resolve()

				// Note here reset it late, means if barrier more writing
				// after resolving writing, should directly resolve.
				this.list[step] = undefined
			}
		}

		this.state = BarrierQueueState.Pending
	}

	/** Resolves currently stepped barrier. */
	private async resolveStep(step: BarrierQueueStep) {
		let {resolve} = this.list[step]!

		// Wait for all updating complete.
		if (step === BarrierQueueStep.ReadDOM) {
			await untilUpdateComplete()
		}

		resolve()
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
	return queue.barrier(BarrierQueueStep.ReadDOM)
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
	return queue.barrier(BarrierQueueStep.WriteDOM)
}
