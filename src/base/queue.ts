import {assign} from './object'
import {removeWhere} from './array'
import {Emitter} from './emitter'


export enum QueueState {
	/** Not started. */
	Pending,

	/** Any task is running. */
	Running,

	/** Been paused. */
	Paused,

	/** All tasks finshed. */
	Finish,

	/** Aborted because of error or by user. */
	Aborted,
}

interface QueueEvents<T, V> {

	/** Emitted after a task handled successfully. */
	taskfinish(task: T, value: V): void

	/** Emitted after error occured when handling a task or called `abort()` on task. */
	taskabort(task: T): void

	/**
	 * Emitted after error occured when handling task.
	 * If `continueOnError` is `false` and `maxRetryTimes` equals `0`, queue will be aborted.
	 */
	error(task: T, err: Error | string | number): void

	/** Emitted after called `pause()`. */
	pause(): void

	/** Emitted after called `resume()`. */
	resume(): void

	/** Emitted after all tasks finished. Note that it can be emitted for multiple times. */
	finish() : void

	/** Emitted after error occured or called `abort()`. */
	abort(err: Error | string | number): void

	/** End after `finish` or `abort` event. */
	end(err: Error | null): void
}

interface QueueItem<T> {
	id: number
	task: T
	retriedTimes: number
	abort: Function | null
}

export interface QueueOptions<T, V> {

	/** If provided, can avoid adding duplicate tasks with same keys. */
	key?: string

	/** Specify how many tasks to run simultaneously, default value is `5`. */
	concurrency?: number

	/** If true, will continue handling tasks after error occurred. */
	continueOnError?: boolean

	/**
	 * Specifies how many times to retry before one task success.
	 * If one task's retry times execeed, it will never retry automatically,
	 * but you can still retry all failed tasks by calling `retry()` manually.
	 * Setting this option to values `> 0` implies `continueOnError` is true.
	 */
	maxRetryTimes?: number

	/** The start task array which will be passed to `handler` in order. */
	tasks?: T[]


	handler: QueueHandler<T, V>
}

type QueueHandler<T, V> = (task: T) => {promise: Promise<V>, abort: Function} | Promise<V> | V


/**
 * Class to queue tasks and transfer them to handler in specified concurrency.
 * @typeparam T: Type of task.
 * @typeparam V: Type of returned values from handler. This can be inferred from handler normally.
 */
export class Queue<T = any, V = void> extends Emitter<QueueEvents<T, V>> {

	/** If provided, can avoid adding duplicate tasks with same keys. */
	key: keyof T | null = null

	/** Specify how many tasks to run simultaneously, default value is `5`. */
	concurrency: number = 5

	/** If true, will continue handling tasks after error occurred. */
	continueOnError: boolean = false

	/**
	 * Specifies how many times to retry before one task success.
	 * If one task's retry times execeed, it will never retry automatically,
	 * but you can still retry all failed tasks by calling `retry()` manually.
	 * Setting this option to values `> 0` implies `continueOnError` is true.
	 */
	maxRetryTimes: number = 0

	/** The start task array which will be passed to `handler` in order. */
	tasks: T[] = []

	/** The handler to handle each task. It may return a value which will transfer to `taskfinish` event. */
	handler!: QueueHandler<T, V>
	
	/** Returns current working state. */
	state: QueueState = QueueState.Pending

	private keysFound: Set<any> | null = null
	private seed: number = 1
	private handledCount: number = 0
	private runningItems: QueueItem<T>[] = []
	private failedItems: QueueItem<T>[] = []
	private resumePromise: Promise<void> | null = null
	private resumeResolve: (() => void) | null = null

	constructor(options: QueueOptions<T, V>) {
		super()
		assign(this, options, Object.keys(options).filter(key => key !== 'tasks') as any[])
		
		if (this.key) {
			this.keysFound = new Set()
		}

		if (options.tasks) {
			this.push(...options.tasks)
		}
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
	getFailedTasks(): T[] {
		return this.failedItems.map(v => v.task)
	}

	/**
	 * Start handling tasks. Will emit `finish` event in next tick if no task to run.
	 * Returns `true` if queue started.
	 */
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

	/**
	 * Returns a promise which will be resolved after all tasks finished, or be rejected if error happens.
	 */
	untilFinish(): Promise<void> {
		if (this.getUnhandledCount() > 0) {
			return new Promise((resolve, reject) => {
				this.once('end', err => err ? reject(err) : resolve())
			})
		}
		else {
			return Promise.resolve()
		}
	}

	/** 
	 * Stop handling tasks, running tasks will not be aborted, but will be locked until `resume()`.
	 * Returns `true` if paused from running state.
	 */
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

	/** 
	 * Resume handling tasks.
	 * Returns `true` if resumed from paused state.
	 */
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
			let task = this.tasks.shift()!

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

	private handleItem(item: QueueItem<T>) {
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
			Promise.resolve().then(() => onItemFinish(<V>value))
		}
	}

	private async onItemFinish(item: QueueItem<T>, value: V) {
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

	private async onItemError(item: QueueItem<T>, err: Error | string | number) {
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
	private async prepareItem(item: QueueItem<T>) {
		item.abort = null

		if (this.resumePromise) {
			await this.resumePromise
		}
	}

	private removeFromRunning(item: QueueItem<T>) {
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

	/** 
	 * Retry all failed tasks immediately, ignore their retried times.
	 * Returns `true` if has failed tasks and queued them.
	 */
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
	 * Abort current queue and all running tasks.
	 * After aborted, queue can still be started manually by calling `start()`.
	 * Returns `true` if queue was successfully aborted.
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

	private abortItem(item: QueueItem<T>) {
		let {task, abort} = item

		if (abort) {
			abort()
		}

		this.emit('taskabort', task)
	}

	/** 
	 * End and finish queue, abort all running tasks and clear all tasks and handling records.
	 * Returns `true` if queue clear successfully.
	 */
	clear(): boolean {
		if (this.state === QueueState.Aborted) {
			return false
		}

		this.state = QueueState.Finish
		this.tasks = []
		this.failedItems = []
		this.handledCount = 0
		this.abortRunningItems()
		this.emit('finish')
		this.emit('end')
		
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
	push(...tasks: T[]) {
		if (this.keysFound) {
			for (let task of tasks) {
				this.keysFound.add(task[this.key!])
			}
		}

		this.tasks.push(...tasks)

		if (this.state === QueueState.Finish) {
			this.start()
		}

		this.mayHandleNextTask()
	}

	/** Unshift tasks to queue. */
	unshift(...tasks: T[]) {
		if (this.keysFound) {
			for (let task of tasks) {
				this.keysFound.add(task[this.key!])
			}
		}

		this.tasks.unshift(...tasks)

		if (this.state === QueueState.Finish) {
			this.start()
		}

		this.mayHandleNextTask()
	}

	/** Returns true if found same key task. */
	has(task: T) {
		if (this.keysFound) {
			return this.keysFound.has(task[this.key!])
		}
		else {
			return false
		}
	}

	/** Push task if not found same key task. */
	add(...tasks: T[]) {
		tasks = tasks.filter(t => !this.has(t))

		if (tasks.length > 0) {
			this.push(...tasks)
		}
	}

	/** Unshift task if not found same key task. */
	addToStart(...tasks: T[]) {
		tasks = tasks.filter(t => !this.has(t))

		if (tasks.length > 0) {
			this.unshift(...tasks)
		}
	}

	/** Find first task match `fn`, handled tasks can't be found. */
	find(fn: (task: T) => boolean): T | undefined {
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

	/** 
	 * Removes tasks included in `tasksToRemove` list.
	 * Only tasks that are running or not been handled can be removed.
	 */
	remove(...tasksToRemove: T[]): T[] {
		let taskSet: Set<T> = new Set(tasksToRemove)
		return this.removeWhere(task => taskSet.has(task))
	}

	/** 
	 * Removes all tasks that matched `fn`.
	 * Only tasks that are running or not been handled can be removed.
	 */
	removeWhere(fn: (task: T) => boolean): T[] {
		let toRemove: T[] = []

		toRemove.push(...removeWhere(this.runningItems, item => fn(item.task)).map(item => item.task))
		toRemove.push(...removeWhere(this.failedItems, item => fn(item.task)).map(item => item.task))
		toRemove.push(...removeWhere(this.tasks, task => fn(task)))

		this.mayHandleNextTask()

		return toRemove
	}
}


/**
 * Run tasks in queue, returns a promise which will be resolved after queue finished.
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
 * Run tasks in queue, returns a promise which will be resolved with returned values from handler after queue finished.
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