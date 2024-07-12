import {trackExecution, untrack} from './dependency-tracker'
import * as UpdateQueue from './update-queue'


/** 
 * Execute `fn` immediately, and if any dependency it used get changed, re-execute `fn`.
 * Note `fn` can only be called once in a event loop.
 */
export function createEffect(fn: () => void): () => void {
	function update() {
		trackExecution(fn, onChange)
	}

	function onChange() {
		UpdateQueue.enqueue(update)
	}

	update()

	return function() {
		untrack(onChange)
	}
}
