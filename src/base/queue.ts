import {assign} from './object'
import {removeWhere} from './array'
import {Emitter} from './emitter'


export enum QueueState {
	/** Tasks handling not started. */
	Pending,

	/** Any task is running. */
	Running,

	/** Been paused. */
	Paused,

	/** All tasks finshed. */
	Finish,

	/** Aborted because of error or aborted by user. */
	Aborted,
}

interface QueueEvents<T, V> {

	/** Emitted after task handled successfully. */
	taskfinish(task: T, value: V): void

	/** Emitted after error occured when handling task or called `abort()` on task. */
	taskabort(task: T): void

	/**
	 * Emitted after error occured when handling task.
	 * If `continueOnError` was false and `maxRetryTimes` equals `0`, queue will be aborted.
	 */
	error(task: T, err: Error | string | number): void

	/** Emitted after called `pause()`. */
	pause(): void

	/** Emitted after called `resume()`. */
	resume(): void

	/** Emitted after all tasks finished. Note that it can be emitted for multiple times */
	finish() : void

	/** Emitted after error occured or called `abort()`. */
	abort(err: Error | string | number): void

	/** End after `finish` or `abort` */
	end(): void
}

interface QueueItem<Task> {
	id: number
	task: Task
	retriedTimes: number
	abort: Function | null
}

export interface QueueOptions<Task, Value> {
	concurrency?: number
	fifo?: boolean
	continueOnError?: boolean
	maxRetryTimes?: number
	tasks?: Task[]
	handler: QueueHandler<Task, Value>
}

type QueueHandler<Task, Value> = (task: Task) => {promise: Promise<Value>, abort: Function} | Promise<Value> | Value


export class Queue<Task = any, Value = void> extends Emitter<QueueEvents<Task, Value>> {

	/** Specify how many tasks to run simultaneously. Default value is `5`. */
	concurrency: number = 5

	/** If true, will run tasks from head of the queue. */
	fifo: boolean = true

	/** If true, will continue handling tasks when error occurs. */
	continueOnError: boolean = false

	/**
	 * How many times to retry after tasks failed.
	 * if one task's retry times execeed, it will never automatically retry, but you can still retry all items by calling `retry()` manually.
	 * Setting this option to values `> 0` implies `continueOnError` is true.
	 */
	maxRetryTimes: number = 0

	/** The task array which will be passed to handler in order. */
	tasks: Task[] = []

	/** The handler to handle each task. It should return a value when `capture` is true. */
	handler: QueueHandler<Task, Value>
	
	/** Returns current working state. */
	state: QueueState = QueueState.Pending

	private seed: number = 1
	private handledCount: number = 0
	private runningItems: QueueItem<Task>[] = []
	private failedItems: QueueItem<Task>[] = []
	private resumePromise: Promise<void> | null = null
	private resumeResolve: (() => void) | null = null

	constructor(options: QueueOptions<Task, Value>) {
		super()

		this.handler = options.handler

		if (options.tasks) {
			this.tasks.push(...options.tasks)
		}
		
		assign(this, options, ['concurrency', 'fifo', 'continueOnError', 'maxRetryTimes'])
	}

	/** Returns the tount of total tasks, included handled and unhandled and failed. */
	getTotalCount() {
		return this.getHandledCount() + this.getUnhandledCount() + this.getFailedCount()
	}

	/** Returns the count of handled tasks. */
	getHandledCount() {
		return this.handledCount
	}

	/** Returns the count of unhandled tasks, not include failed tasks. */
	getUnhandledCount() {
		return this.tasks.length + this.getRunningCount()
	}

	/** Returns the count of running tasks. */
	getRunningCount() {
		return this.runningItems.length
	}

	/** Returns the count of failed tasks. */
	getFailedCount() {
		return this.failedItems.length
	}

	/** Returns the unhandled tasks. */
	getUnhandledTasks() {
		return [...this.getRunningTasks(), ...this.tasks]
	}

	/** Returns the running tasks. */
	getRunningTasks() {
		return this.runningItems.map(v => v.task)
	}

	/** Returns the failed tasks. */
	getFailedTasks(): Task[] {
		return this.failedItems.map(v => v.task)
	}

	/** Start handling tasks. Will emit `finish` event in next tick if no task to run. Returns if true queue started. */
	start() {
		if (this.state === QueueState.Paused) {
			this.resume()
		}
		else if (this.tasks.length > 0) {
			this.state = QueueState.Running
			this.mayHandleNextTask()
		}
		else {
			Promise.resolve().then(() => this.onFinish())
		}

		return this.state === QueueState.Running
	}

	untilFinish(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.once('end', err => err ? reject(err) : resolve())
		})
	}

	/** Pause handling tasks, running tasks will not aborted, but will not emit task events until `resume()`. Returns if paused from running state. */
	pause(): boolean {
		if (this.state !== QueueState.Running) {
			return false
		}

		this.state = QueueState.Paused
		this.resumePromise = new Promise(resolve => {
			this.resumeResolve = () => {
				this.resumeResolve = null
				this.resumePromise = null
				resolve()
			}
		})
		
		this.emit('pause')

		return true
	}

	/** Resume handling tasks. Returns if resumed from paused state. */
	resume(): boolean {
		if (this.state !== QueueState.Paused) {
			return false
		}

		this.state = QueueState.Running

		if (this.resumeResolve) {
			this.resumeResolve()
		}

		this.emit('resume')
		this.mayHandleNextTask()

		return true
	}

	private mayHandleNextTask() {
		// State may change after in event handler, so we need to test state here.
		if (this.state !== QueueState.Running) {
			return
		}
		
		while (this.getRunningCount() < this.concurrency && this.tasks.length > 0) {
			let task = this.fifo ? this.tasks.shift()! : this.tasks.pop()!

			this.handleItem({
				id: this.seed++,
				task,
				retriedTimes: 0,
				abort: null
			})
		}

		if (this.maxRetryTimes > 0 && this.getRunningCount() < this.concurrency && this.failedItems.length) {
			for (let i = 0; i < this.failedItems.length; i++) {
				let item = this.failedItems[i]
				if (item.retriedTimes < this.maxRetryTimes) {
					item.retriedTimes++
					this.failedItems.splice(i--, 1)
					this.handleItem(item)

					if (this.getRunningCount() >= this.concurrency) {
						break
					}
				}
			}
		}

		if (this.getRunningCount() === 0) {
			this.onFinish()
		}
	}

	private handleItem(item: QueueItem<Task>) {
		let {task} = item
		let onItemFinish = this.onItemFinish.bind(this, item)
		let onItemError = this.onItemError.bind(this, item)
		
		this.runningItems.push(item)

		let value = this.handler(task)
		if (value && typeof value === 'object' && (value as any).promise instanceof Promise && typeof (value as any).abort === 'function') {
			(value as any).promise.then(onItemFinish, onItemError)
			item.abort = (value as any).abort
		}
		else if (value instanceof Promise) {
			value.then(onItemFinish, onItemError)
		}
		else {
			Promise.resolve().then(() => onItemFinish(<Value>value))
		}
	}

	private async onItemFinish(item: QueueItem<Task>, value: Value) {
		await this.prepareItem(item)
		
		if (!this.removeFromRunning(item)) {
			return
		}

		this.handledCount++

		if (this.state === QueueState.Running) {
			this.emit('taskfinish', item.task, value)
			this.mayHandleNextTask()
		}
	}

	private async onItemError(item: QueueItem<Task>, err: Error | string | number) {
		await this.prepareItem(item)
		
		if (!this.removeFromRunning(item)) {
			return
		}

		this.failedItems.push(item)
		this.emit('error', item.task, err)

		if (!this.continueOnError && this.maxRetryTimes === 0) {
			this.onFatalError(err)
		}
		else {
			this.mayHandleNextTask()
		}
	}

	// Prepare until we can handle it, normally is the state changed from pause to resume.
	private async prepareItem(item: QueueItem<Task>) {
		item.abort = null

		if (this.resumePromise) {
			await this.resumePromise
		}
	}

	private removeFromRunning(item: QueueItem<Task>) {
		let index = this.runningItems.findIndex(v => v.id === item.id)
		if (index > -1) {
			this.runningItems.splice(index, 1)
			return true
		}

		return false
	}

	private onFinish() {
		if (this.state === QueueState.Pending || this.state === QueueState.Running) {
			this.state = QueueState.Finish
			this.emit('finish')
			this.emit('end', null)
		}
	}

	private onFatalError(err: Error | string | number) {
		this.abort(err)
	}

	/** Retry all failed tasks immediately, ignore their retried times count. Returns if has failed tasks and queue started. */
	retry() {
		let hasFailedTasks = this.getFailedCount() > 0
		if (hasFailedTasks) {
			this.tasks.push(...this.getFailedTasks())
			this.failedItems = []
		}

		let started = this.start()

		return started && hasFailedTasks
	}

	/**
	 * Abort queue and all running tasks. After aborted, queue ca still be started by calling `start()`.
	 * Returns if queue was successfully aborted.
	 */
	abort(err: Error | string | number = 'manually'): boolean {
		if (!(this.state === QueueState.Running || this.state === QueueState.Paused)) {
			return false
		}

		this.state = QueueState.Aborted
		this.failedItems.push(...this.runningItems)
		this.abortRunningItems()
		this.emit('abort', err)
		this.emit('end', err)
		return true
	}

	private abortRunningItems() {
		this.runningItems.map(item => this.abortItem(item))
		this.runningItems = []
	}

	private abortItem(item: QueueItem<Task>) {
		let {task, abort} = item

		if (abort) {
			abort()
		}

		this.emit('taskabort', task)
	}

	/** End queue, abort all running tasks and clear all tasks and handling records. */
	clear(): boolean {
		if (!(this.state === QueueState.Running || this.state === QueueState.Paused)) {
			return false
		}

		this.state = QueueState.Finish
		this.tasks = []
		this.failedItems = []
		this.handledCount = 0
		this.abortRunningItems()
		
		if (this.resumeResolve) {
			this.resumeResolve()
		}

		return true
	}

	/** Remove all not running tasks. */
	clearNotRunning() {
		this.tasks = []
		this.failedItems = []
		this.handledCount = 0
	}

	/** Push tasks to queue. */
	push(...tasks: Task[]) {
		this.tasks.push(...tasks)

		if (this.state === QueueState.Finish) {
			this.start()
		}

		this.mayHandleNextTask()
	}

	/** Unshift tasks to queue. */
	unshift(...items: Task[]) {
		this.tasks.unshift(...items)

		if (this.state === QueueState.Finish) {
			this.start()
		}

		this.mayHandleNextTask()
	}

	/** Find first matched task. */
	find(fn: (task: Task) => boolean): Task | undefined {
		let item = this.runningItems.find(item => fn(item.task))
		if (item) {
			return item.task
		}

		item = this.failedItems.find(item => fn(item.task))
		if (item) {
			return item.task
		}

		let task = this.tasks.find(task => fn(task))
		if (task) {
			return task
		}

		return undefined
	}

	/** Remove tasks even the task is running, note that it's O(m * n) algorithm */
	remove(...tasks: Task[]): Task[] {
		let removed: Task[] = []

		for (let task of tasks) {
			let index = this.runningItems.findIndex(item => item.task === task)
			if (index > -1) {
				this.abortItem(this.runningItems.splice(index, 1)[0])
				removed.push(task)
			}
			else {
				index = this.failedItems.findIndex(item => item.task === task)
				if (index > -1) {
					this.failedItems.splice(index, 1)
					removed.push(task)
				}
			}

			if (index === -1) {
				index = this.tasks.findIndex(v => v === task)
				if (index > -1) {
					tasks.splice(index, 1)
					removed.push(task)
				}
			}
		}

		this.mayHandleNextTask()

		return removed
	}

	/** Remove all matched tasks even the task is running. */
	removeWhere(fn: (task: Task) => boolean): Task[] {
		let removed: Task[] = []

		let runningItems = removeWhere(this.runningItems, item => fn(item.task))
		runningItems.forEach(item => this.abortItem(item))
		removed.push(...runningItems.map(item => item.task))

		removed.push(...removeWhere(this.failedItems, item => fn(item.task)).map(item => item.task))
		removed.push(...removeWhere(this.tasks, task => fn(task)))

		this.mayHandleNextTask()

		return removed
	}
}


/**
 * Run tasks in queue, returns a promise which will be resolved after finished.
 * @param tasks The task array which will be passed to handler in order. 
 * @param handler The handler to handle each task.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueEach<Task>(tasks: Task[], handler: (task: Task) => Promise<void> | void, concurrency?: number): Promise<void> {
	return new Promise((resolve, reject) => {
		let q = new Queue({
			concurrency,
			tasks,
			handler
		})

		q.on('finish', resolve)
		q.on('error', reject)
		q.start()
	})
}


/**
 * Run tasks in queue, returns a promise which will be resolved with returned values from handler after finished.
 * @param tasks The task array which will be passed to handler in order. 
 * @param handler The handler to handle each task. It should returns a value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueMap<Task, Value>(tasks: Task[], handler: (task: Task) => Promise<Value> | Value, concurrency?: number): Promise<Value[]> {
	return new Promise((resolve, reject) => {
		let values: Value[] = []
		let indexedTasks = tasks.map((task, index) => ({task, index}))

		let q = new Queue({
			concurrency,
			tasks: indexedTasks,
			handler: async ({task, index}) => {
				values[index] = await handler(task)
			}
		})

		q.on('finish', () => resolve(values))
		q.on('error', reject)
		q.start()
	})
}


/**
 * Run tasks in queue, returns a promise which will be resolved if some tasks match handler.
 * @param tasks The task array which will be passed to handler in order. 
 * @param handler The handler to handle each task. It should returns a boolean value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueSome<Task>(tasks: Task[], handler: (task: Task) => Promise<boolean> | boolean, concurrency?: number): Promise<boolean> {
	return new Promise((resolve, reject) => {
		let q = new Queue({
			concurrency,
			tasks,
			handler
		})

		q.on('taskfinish', (_task: Task, value: boolean) => {
			if (value) {
				resolve(true)
				q.clear()
			}
		})

		q.on('finish', () => resolve(false))
		q.on('error', reject)
		q.start()
	})
}


/**
 * Run tasks in queue, returns a promise which will be resolved if every tasks match handler.
 * @param tasks The task array which will be passed to handler in order. 
 * @param handler The handler to handle each task. It should returns a boolean value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueEvery<Task>(tasks: Task[], handler: (task: Task) => Promise<boolean> | boolean, concurrency?: number): Promise<boolean> {
	return queueSome(
		tasks,
		async (task: Task) => !(await handler(task)),
		concurrency
	).then(value => !value)
}