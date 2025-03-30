import {promiseWithResolves} from '../utils'


/** Manage a task sequence, and process tasks one by one. */
export class AsyncTaskQueue {

	/** Callbacks to start next task. */
	private startNextTaskCallback: (() => void)[] = []

	/** 
	 * Request to get a promise, which will be resolved after previous task end,
	 * and current task can be started immediately.
	 * Returns a callback, call which to complete current task.
	 */
	private request(): Promise<() => void> {
		let {promise, resolve} = promiseWithResolves<() => void>()

		// Resolve next promise, and shift out a task.
		let startCurrentTask = () => {
			resolve(this.startNextTask.bind(this))
		}

		this.startNextTaskCallback.push(startCurrentTask)

		// Resolve promise immediately if no previous task.
		if (this.startNextTaskCallback.length === 1) {
			startCurrentTask()
		}
		
		return promise
	}

	/** 
	 * Enqueue a task function, run it after previous task end.
	 * Returns a promise which will be resolved after this task end.
	 */
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