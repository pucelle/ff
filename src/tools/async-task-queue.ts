/** Manage a task sequence, and process tasks one by one. */
export class AsyncTaskQueue {

	/** Promise for latest task. */
	private lastTaskPromise: Promise<void> | null = null

	/** 
	 * Enqueue a task function, run it after previous task end.
	 * Returns a promise which will be resolved after this task end.
	 */
	async enqueue(taskFn: () => Promise<void>) {
		let {promise, resolve} = Promise.withResolvers<void>()
		let lastPromise = this.lastTaskPromise

		// Must replace it immediately.
		this.lastTaskPromise = promise

		if (lastPromise) {
			await lastPromise
		}

		try {
			await taskFn()
		}
		finally {
			
			// Always release the queue, even when the task rejects.
			resolve()

			if (this.lastTaskPromise === promise) {
				this.lastTaskPromise = null
			}
		}
	}
}
