/** 
 * Request to get a promise, which will be resolved after previous task end,
 * and current task will be started immediately.
 */
export class AsyncTaskQueue {

	/** Callbacks to start next task. */
	private startNextTaskCallback: (() => void)[] = []

	/** 
	 * Returns a promise, be resolved after current task be started.
	 * Its promise resolve value is a callback, call it after current task is ended.
	 */
	request(): Promise<() => void> {
		return new Promise((resolve) => {

			// Resolve next promise, and shift out a task.
			let startCurrentTask = () => {
				resolve(this.startNextTask.bind(this))
			}

			this.startNextTaskCallback.push(startCurrentTask)

			// Resolve promise immediately if no previous task.
			if (this.startNextTaskCallback.length === 1) {
				startCurrentTask()
			}
		})
	}

	/** Enqueue a task function, run it after previous task end. */
	async enqueue(taskFn: () => Promise<void>) {
		let next = await this.request()
		await taskFn()
		next()
	}

	/** Remove current task, start next task. */
	private startNextTask() {
		this.startNextTaskCallback.shift()

		if (this.startNextTaskCallback.length > 0) {
			this.startNextTaskCallback[0]()
		}
	}
}