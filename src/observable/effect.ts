import {DependencyTracker} from './dependency-tracker'
import {UpdateQueue} from './update-queue'


/** 
 * Execute `fn`, and if any depedency it used get changed, re-execute `fn`.
 * Note `fn` can only be called once in a event loop.
 */
export function createEffect(fn: () => void): () => void {
	function update() {
		DependencyTracker.trackExecutionOf(fn, onChange)
	}

	function onChange() {
		UpdateQueue.enqueue(update)
	}

	DependencyTracker.trackExecutionOf(fn, onChange)

	return function() {
		DependencyTracker.untrack(onChange)
	}
}
