import {ListUtils, ObjectUtils, promiseWithResolves, sleep, Timeout} from '../utils'
import {EventFirer} from '../events'


/** Running state of queue. */
export enum TaskQueueState {

	/** Not started yet. */
	Pending,

	/** Any task is running. */
	Running,

	/** In paused state. */
	Paused,

	/** All tasks finished, may still have failed tasks. */
	Finished,

	/** Been aborted because of error or manually. */
	Aborted,
}

/** Events of queue. */
interface TaskQueueEvents<T, V> {

	/** After a task processed successfully. */
	'task-finished'(data: T, value: V): void

	/** After error occurred when processing a task or called `abort()` on task. */
	'task-aborted'(data: T): void

	/**
	 * After error occurred when processing task.
	 * If `continueOnError` is `false` and `maxRetryTimes` equals `0`, queue will be aborted.
	 */
	'task-error'(data: T, err: Error | string | number): void

	/** After queue started. */
	started(): void

	/** After called `pause()`. */
	paused(): void

	/** After called `resume()`. */
	resumed(): void

	/** 
	 * After all the tasks finished.
	 * Note that it can be Triggered for multiple times.
	 */
	finished() : void

	/** After any error occurred or called `abort()`. */
	aborted(err: Error | string | number): void

	/** End after `finished` or `aborted` event. */
	ended(err: Error | string | number | null): void
}

/** Cache data of queue, each caches one task. */
interface TaskQueueTask<T> {
	data: T
	retriedTimes: number
}

/** Options of queue. */
export interface TaskQueueOptions<T, V> {

	/** 
	 * Specifies how many tasks are allowed to run simultaneously.
	 * Default value is `5`.
	 */
	concurrency?: number

	/** If `true`, will continue processing tasks after any error occurred. */
	continueOnError?: boolean

	/** If specified, and a task's run time exceed, then it will be passed. */
	taskTimeout?: number

	/**
	 * Specifies how many times can retry before a task success.
	 * If a task's retry times exceed, it will not be retried automatically,
	 * but you can still retry all failed tasks by calling `retry()` manually.
	 * Setting this option to values `> 0` implies `continueOnError` is `true`.
	 */
	maxRetryTimes?: number

	/** How long to delay after each task become completed before running next. */
	delayMs?: number

	/** The task data array. */
	data: T[]

	/** The handler to process each task. */
	handler: (task: T) => Promise<V> | V

	/** To handle aborting task. */
	abortHandler?: (task: T) => void
}

const DefaultSyncTaskQueueOptions: Partial<TaskQueueOptions<any, any>> = {
	concurrency: 5,
	continueOnError: false,
	maxRetryTimes: 0,
	delayMs: 0,
}


/** Class to queue tasks and pass them to handler in specified concurrency. */
export class TaskQueue<T = any, V = void> extends EventFirer<TaskQueueEvents<T, V>> implements Partial<TaskQueueOptions<T, V>> {

	/**
	 * Run each task by passing `data` items to `handler` in order.
	 * Returns a promise which will be resolved after tasks become finished.
	 */
	static each<T>(data: T[], handler: (data: T) => Promise<void> | void, concurrency?: number): Promise<void> {
		let {promise, resolve, reject} = promiseWithResolves()

		let q = new TaskQueue({
			concurrency,
			data,
			handler
		})

		q.on('finished', resolve)
		q.on('task-error', reject)
		q.start()

		return promise
	}

	/**
	 * Run each task by passing `data` items to `handler` in order.
	 * Returns a promise which will be resolved with returned values list.
	 */
	static map<T, V>(data: T[], handler: (data: T) => Promise<V> | V, concurrency?: number): Promise<V[]> {
		let {promise, resolve, reject} = promiseWithResolves<V[]>()
		let values: V[] = []
		let indexedTasks = data.map((task, index) => ({task, index}))

		let q = new TaskQueue({
			concurrency,
			data: indexedTasks,
			handler: async ({task, index}) => {
				values[index] = await handler(task)
			}
		})

		q.on('finished', () => resolve(values))
		q.on('task-error', reject)
		q.start()

		return promise
	}

	/**
	 * Run each task by passing `data` items to `testFn` in order.
	 * Returns a promise which will be resolved if some tasks match `testFn`.
	 */
	static some<T>(data: T[], testFn: (task: T) => Promise<boolean> | boolean, concurrency?: number): Promise<boolean> {
		let {promise, resolve, reject} = promiseWithResolves<boolean>()

		let q = new TaskQueue({
			concurrency,
			data,
			handler: testFn,
		})

		q.on('task-finished', (_task: T, value: boolean) => {
			if (value) {
				resolve(true)
				q.clear()
			}
		})

		q.on('finished', () => resolve(false))
		q.on('task-error', reject)
		q.start()
		
		return promise
	}

	/**
	 * Run each task by passing `data` items to `testFn` in order.
	 * Returns a promise which will be resolved if every tasks match `testFn`.
	 */
	static every<T>(data: T[], testFn: (task: T) => Promise<boolean> | boolean, concurrency?: number): Promise<boolean> {
		return TaskQueue.some(
			data,
			async (task: T) => !(await testFn(task)),
			concurrency,
		).then(value => !value) as Promise<boolean>
	}


	concurrency!: number
	continueOnError!: boolean
	maxRetryTimes!: number
	delayMs!: number
	taskTimeout: number | undefined = undefined
	abortHandler: ((task: T) => void) | undefined = undefined

	/** 
	 * Note data will not be emptied after finished.
	 * You may set it to `[]` manually.
	 */
	data: T[] = []

	readonly handler!: (task: T) => Promise<V> | V
	
	/** 
	 * Returns current working state.
	 * Readonly outside.
	 */
	state: TaskQueueState = TaskQueueState.Pending

	/** 
	 * Count of processed tasks.
	 * Readonly outside.
	 */
	processedCount: number = 0

	/** 
	 * All running tasks.
	 * Readonly outside.
	 */
	runningTasks: TaskQueueTask<T>[] = []

	/** All failed tasks. */
	private failedTasks: TaskQueueTask<T>[] = []

	constructor(options: TaskQueueOptions<T, V>) {
		super()
		ObjectUtils.assign(this, DefaultSyncTaskQueueOptions, options)
		this.data = [...options.data]
	}

	/** Whether in pending state. */
	get pending(): boolean {
		return this.state === TaskQueueState.Pending
	}

	/** Whether in running state. */
	get running(): boolean {
		return this.state === TaskQueueState.Running
	}

	/** Whether in paused state. */
	get paused(): boolean {
		return this.state === TaskQueueState.Paused
	}

	/** Whether in aborted state. */
	get aborted(): boolean {
		return this.state === TaskQueueState.Aborted
	}

	/** Whether in finished state. */
	get finished(): boolean {
		return this.state === TaskQueueState.Finished
	}

	/** Whether in finished or aborted state. */
	get ended(): boolean {
		return this.state === TaskQueueState.Finished
			|| this.state === TaskQueueState.Aborted
	}

	/** Returns the count of total tasks, included processed, unprocessed and failed. */
	get totalCount() {
		return this.processedCount + this.unprocessedCount + this.failedCount
	}

	/** Returns the count of unprocessed tasks, not include failed tasks. */
	get unprocessedCount() {
		return this.data.length + this.runningCount
	}

	/** Returns the count of running tasks. */
	get runningCount() {
		return this.runningTasks.length
	}

	/** Returns the count of failed tasks. */
	get failedCount() {
		return this.failedTasks.length
	}

	/** Returns the running task data. */
	get runningTaskData() {
		return this.runningTasks.map(t => t.data)
	}

	/** Returns the failed task data. */
	get failedTaskData(): T[] {
		return this.failedTasks.map(t => t.data)
	}

	/** Returns the unprocessed tasks. */
	get unprocessedTaskData() {
		return [...this.runningTasks.map(t => t.data), ...this.data]
	}

	/**
	 * Start processing tasks. Will fire `finish` event in next tick if no task to run.
	 * Returns `true` if queue started.
	 */
	start() {
		if (this.state === TaskQueueState.Running) {
			return false
		}

		if (this.state === TaskQueueState.Paused) {
			this.resume()
		}
		else if (this.data.length > 0) {
			this.state = TaskQueueState.Running
			this.fire('started')
			this.tryNextTask()
		}
		else {
			Promise.resolve().then(() => this.onFinish())
		}

		return this.state === TaskQueueState.Running
	}

	/** Returns a promise which will be resolved after finished. */
	untilFinished(): Promise<void> {
		let {promise, resolve} = promiseWithResolves()

		if (this.unprocessedCount > 0) {
			this.once('finished', resolve)
		}
		else {
			resolve()
		}

		return promise
	}

	/** Returns a promise which will be resolved after ended. */
	untilEnded(): Promise<void> {
		let {promise, resolve, reject} = promiseWithResolves()

		if (this.unprocessedCount > 0) {
			this.once('ended', err => err ? reject(err) : resolve())
		}
		else {
			resolve()
		}

		return promise
	}

	/** 
	 * Stop processing tasks, running tasks will not be aborted, but will be locked until `resume()`.
	 * Returns `true` if paused from running state.
	 */
	pause(): boolean {
		if (this.state !== TaskQueueState.Running) {
			return false
		}

		this.state = TaskQueueState.Paused
		this.fire('paused')

		return true
	}

	/** 
	 * Resume processing tasks.
	 * Returns `true` if resumed from paused state.
	 */
	resume(): boolean {
		if (this.state !== TaskQueueState.Paused) {
			return false
		}

		this.state = TaskQueueState.Running
		this.fire('resumed')
		this.tryNextTask()

		return true
	}

	private tryNextTask() {
		
		// State may change after running event handler, so we also need to test state here.
		if (this.state !== TaskQueueState.Running) {
			return
		}
		
		while (this.runningCount < this.concurrency && this.data.length > 0) {
			let item = this.data.shift()!

			this.handleTask({
				data: item,
				retriedTimes: 0,
			})
		}

		if (this.maxRetryTimes > 0 && this.runningCount < this.concurrency && this.failedTasks.length) {
			for (let i = 0; i < this.failedTasks.length; i++) {
				let item = this.failedTasks[i]
				if (item.retriedTimes < this.maxRetryTimes) {
					item.retriedTimes++
					this.failedTasks.splice(i--, 1)
					this.handleTask(item)

					if (this.runningCount >= this.concurrency) {
						break
					}
				}
			}
		}

		if (this.runningCount === 0) {
			this.onFinish()
		}
	}

	private async handleTask(task: TaskQueueTask<T>) {
		let {data} = task
		let taskReturned = this.handler(data)
		let timeout: Timeout | null = null

		if (this.taskTimeout) {
			timeout = new Timeout(() => {
				this.off('task-aborted', onTaskAborted)
				this.onTaskError(task, 'Timeout')
			}, this.taskTimeout)

			let onTaskAborted = (data: T) => {
				if (data === task.data) {
					timeout!.cancel()
				}
			}

			this.on('task-aborted', onTaskAborted)
		}

		this.runningTasks.push(task)

		try {
			let value = await taskReturned
			this.onTaskFinish(task, value)
		}
		catch (err) {
			this.onTaskError(task, err as any)
		}
		finally {
			timeout?.cancel()
		}
	}

	private async onTaskFinish(task: TaskQueueTask<T>, value: V) {
		if (!this.removeFromRunningTasks(task)) {
			return
		}

		this.processedCount++

		if (this.state === TaskQueueState.Running) {
			this.fire('task-finished', task.data, value)

			if (this.delayMs > 0) {
				await sleep(this.delayMs)
			}

			this.tryNextTask()
		}
	}

	private async onTaskError(task: TaskQueueTask<T>, err: Error | string | number) {
		if (!this.removeFromRunningTasks(task)) {
			return
		}

		this.failedTasks.push(task)
		this.fire('task-error', task.data, err)

		if (!this.continueOnError && this.maxRetryTimes === 0) {
			this.onError(err)
		}
		else {
			this.tryNextTask()
		}
	}

	private removeFromRunningTasks(task: TaskQueueTask<T>): boolean {
		return ListUtils.remove(this.runningTasks, task).length > 0
	}

	private onFinish() {
		if (this.state === TaskQueueState.Pending || this.state === TaskQueueState.Running) {
			this.state = TaskQueueState.Finished
			this.fire('finished')
			this.fire('ended', null)
		}
	}

	private onError(err: Error | string | number) {
		this.abort(err)
	}

	/** 
	 * Retry all failed tasks immediately, ignore their retried times.
	 * Returns `true` if has failed tasks and has enqueued them.
	 */
	retry(): boolean {
		let hasFailedTasks = this.failedCount > 0
		if (hasFailedTasks) {
			this.data.push(...this.failedTaskData)
			this.failedTasks = []
		}

		let started = this.start()

		return started && hasFailedTasks
	}

	/**
	 * Abort all tasks, running tasks become failed.
	 * After aborted, queue can still be started manually by calling `start()`.
	 * Returns `true` if queue was successfully aborted.
	 */
	abort(err: Error | string | number = 'manually'): boolean {
		if (!(this.state === TaskQueueState.Running || this.state === TaskQueueState.Paused)) {
			return false
		}

		this.state = TaskQueueState.Aborted
		this.failedTasks.push(...this.runningTasks)
		this.abortRunningTasks()
		this.fire('aborted', err)
		this.fire('ended', err)

		return true
	}

	private abortRunningTasks() {
		this.runningTasks.forEach(task => this.abortTask(task))
		this.runningTasks = []
	}

	private abortTask(task: TaskQueueTask<T>) {
		this.abortHandler?.(task.data)
		this.fire('task-aborted', task.data)
	}

	/** End and finish queue, abort all running tasks and clear all tasks. */
	clear() {
		this.data = []
		this.failedTasks = []
		this.processedCount = 0
		this.abortRunningTasks()
		
		if (this.state !== TaskQueueState.Finished) {
			this.state = TaskQueueState.Finished
			this.fire('finished')
			this.fire('ended', null)
		}
	}

	/** Clear all the not processed tasks, include failed tasks. */
	clearUnProcessed() {
		this.data = []
		this.failedTasks = []
	}

	/** Push task data to queue. */
	push(...data: T[]) {
		this.data.push(...data)
		this.tryNextTask()
	}

	/** Unshift task data to queue. */
	unshift(...data: T[]) {
		this.data.unshift(...data)
		this.tryNextTask()
	}

	/** 
	 * Find first task data match test function `fn`.
	 * Processed tasks are ignored.
	 */
	find(fn: (data: T) => boolean): T | undefined {
		let task = this.runningTasks.find(item => fn(item.data))
		if (task) {
			return task.data
		}

		task = this.failedTasks.find(item => fn(item.data))
		if (task) {
			return task.data
		}

		let data = this.data.find(task => fn(task))
		if (data) {
			return data
		}

		return undefined
	}

	/** 
	 * Removes tasks which's data is included in `data`.
	 * Processed tasks are ignored.
	 * Returns the removed task data.
	 */
	remove(...data: T[]): T[] {
		let set: Set<T> = new Set(data)
		return this.removeWhere(task => set.has(task))
	}

	/** 
	 * Removes all tasks that match test function `fn`.
	 * Processed tasks are ignored.
	 * Returns the removed task data.
	 */
	removeWhere(fn: (item: T) => boolean): T[] {
		let toRemove: T[] = []

		this.runningTasks = this.runningTasks.filter(task => {
			if (fn(task.data)) {
				toRemove.push(task.data)
				return false
			}
			else {
				return true
			}
		})

		this.failedTasks = this.failedTasks.filter(task => {
			if (fn(task.data)) {
				toRemove.push(task.data)
				return false
			}
			else {
				return true
			}
		})

		this.data = this.data.filter(data => {
			if (fn(data)) {
				toRemove.push(data)
				return false
			}
			else {
				return true
			}
		})

		this.tryNextTask()

		return toRemove
	}
}
