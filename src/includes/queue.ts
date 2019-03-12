import {assign} from './object'
import {removeWhere} from './array'
import {Emitter, Events} from './emitter'

export enum QueueState {
	/** Tasks handling not started. */
	Pending,

	/** Any task is running. */
	Running,

	/** Been paused. */
	Paused,

	/** All tasks finshed. */
	Finished,

	/** Aborted because of error or by user. */
	Aborted,
}

interface QueueEvents<T, V> extends Events{
	/** Emitted after more tasks added to queue. */
	tasksadded(tasks: T[]): void

	/** Emitted after task handled successfully. */
	taskfinish(task: T, value: V): void

	/** Emitted after error occured when handling task. If not registered this event and `maxRetryTimes = 0`, error will throw and then abort the queue. */
	taskerror(task: T, err: Error | string): void

	/** Emitted after error occured when handling task or called `abort()` on task. */
	taskabort(task: T): void

	/** Emitted after called `pause()`. */
	pause(): void

	/** Emitted after called `resume()`. */
	resume(): void

	/** Emitted after all tasks finished. Note that it can be emitted for multiple times */
	finish() : void

	/** Emitted after error occured or called `abort()`. */
	abort(err: Error | string): void

	/** Emitted after called `end()`. */
	end(): void
}

interface QueueItem<T> {
	id: number
	task: T
	index: number
	retriedTimes: number
	abort: Function | null
}

export interface QueueOptions<T, V> {
	concurrency?: number
	capture?: boolean
	fifo?: boolean
	maxRetryTimes?: number
	tasks?: T[]
	handler: QueueHandler<T, V>
}

type QueueHandler<T, V> = (task: T) => {promise: Promise<V>, abort: Function} | Promise<V> | V


export class Queue<T, V> extends Emitter<QueueEvents<T, V>> {

	/** Specify how many tasks to run simultaneously. */
	concurrency: number = 10

	/** If true, will run tasks from head of the queue. */
	fifo: boolean = true

	/** If true, will capture handler returns and cache them in capturedValues by their index of tasks. */
	capture: boolean = false

	/** How many times to retry after task failed, if one task retry times execeed, trigger error if binded error event, others pause for a while. */
	maxRetryTimes: number = 0

	/** Specify the task array which will be passed to handler in order. */
	tasks: T[] = []

	/** Specify the handler to handle each task. It should return a value when `capture` is true. */
	handler: QueueHandler<T, V>
	
	/** Returns current working state. */
	state: QueueState = QueueState.Pending

	/** Returns the captured values from handler when `capture` is true. */
	captured: V[] = []

	private seed: number = 1
	private handledCount: number = 0
	private runningItems: QueueItem<T>[] = []
	private failedItems: QueueItem<T>[] = []
	private resumePromise: Promise<void> | null = null
	private resumeResolve: (() => void) | null = null

	constructor(options: QueueOptions<T, V>) {
		super()

		this.handler = options.handler

		if (options.tasks) {
			this.tasks.push(...options.tasks)
		}
		
		assign(this, options, ['concurrency', 'capture', 'fifo', 'maxRetryTimes'])
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

	private assertCanRun() {
		if (!this.canRun()) {
			throw new Error('Queue is ended')
		}
	}

	/** Returns if can handle more tasks. Should returns false after ended. */
	canRun() {
		return this.state === QueueState.Pending || this.state === QueueState.Running || this.state === QueueState.Finished
	}

	/** Start handling tasks. Will emit finish event if no task to run. Returns if queue started */
	start() {
		this.assertCanRun()

		if ((this.state === QueueState.Pending || this.state === QueueState.Finished) && this.tasks.length > 0) {
			this.state = QueueState.Running
			this.mayHandleNextTask()
		}
		else {
			this.onFinished()
		}

		return this.state === QueueState.Running
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
		//state may change after in event handler, so we need to test state here.
		if (this.state !== QueueState.Running) {
			return
		}
		
		while (this.getRunningCount() < this.concurrency && this.tasks.length > 0) {
			let task = this.fifo ? this.tasks.shift()! : this.tasks.pop()!
			let index = this.getHandledCount() + this.getRunningCount() + this.getFailedCount()
			
			this.handleItem({
				id: this.seed++,
				task,
				index,
				retriedTimes: 0,
				abort: null
			})
		}

		if (this.getRunningCount() < this.concurrency && this.failedItems.length) {
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
			this.onFinished()
		}
	}

	private handleItem(item: QueueItem<T>) {
		let {task} = item
		let onItemFinish = this.onItemFinish.bind(this, item)
		let onItemError = this.onItemError.bind(this, item)
		
		this.runningItems.push(item)

		let value = this.handler(task)
		if (typeof value === 'object' && (<any>value).promise instanceof Promise && typeof (<any>value).abort === 'function') {
			item.abort = (<any>value).abort
			(<any>value).promise.then(onItemFinish, onItemError)
		}
		else if (value instanceof Promise) {
			value.then(onItemFinish, onItemError)
		}
		else {
			Promise.resolve().then(() => onItemFinish(<V>value))
		}
	}


	private async onItemFinish(item: QueueItem<T>, value: V) {
		item.abort = null

		if (this.resumePromise) {
			await this.resumePromise
		}

		if (!this.removeFromRunningItem(item)) {
			return
		}

		this.handledCount++

		if (this.captured) {
			this.captured[item.index] = value
		}

		if (this.state === QueueState.Running) {
			this.emit('taskfinish', item.task, value)
			this.emit('taskend', item.task, true)	
			this.mayHandleNextTask()
		}
	}

	private async onItemError(item: QueueItem<T>, err: Error | string) {
		item.abort = null

		if (this.resumePromise) {
			await this.resumePromise
		}

		if (!this.removeFromRunningItem(item)) {
			return
		}

		this.failedItems.push(item)

		let hasTaskErrorListener = this.hasListener('taskerror')
		let hasRetryTimesSet = this.maxRetryTimes > 0

		if (this.state === QueueState.Running) {
			this.emit('taskerror', item.task, err)
		}

		if (hasErrorEvent && retryTimesExceed) {
			this.onError(err)
		}
		else {
			this.mayHandleNextTask()
		}
	}

	private removeFromRunningItem(item: QueueItem<T>) {
		let index = this.runningItems.findIndex(v => v.id === item.id)
		if (index > -1) {
			this.runningItems.splice(index, 1)
			return true
		}

		return false
	}

	private onFinished() {
		if (this.state === QueueState.Pending || this.state === QueueState.Running) {
			this.state = QueueState.Finished
			this.emit('finish')
		}
	}

	private onError(err: Error | string) {
		if (this.state === QueueState.Running) {
			this.emit('error', err)
			this.abort('error')
		}
	}

	/** Retry all failed tasks immediately, ignore their retried times count. */
	retry() {
		this.assertCanRun()
		
		if (this.getFailedCount() > 0) {
			this.tasks.push(...this.getFailedTasks())
			this.failedItems = []
		}

		this.start()
	}

	/** Abort queue and all running tasks. after aborted, queue will can't be restarted anymore. */
	async abort(err: Error | string = 'manually'): Promise<boolean> {
		if (!(this.state === QueueState.Running || this.state === QueueState.Paused)) {
			return false
		}

		this.state = QueueState.Aborted
		await this.abortRunningTasks()
		this.emit('abort', err)
		return true
	}


	private async abortRunningTasks() {
		while (this.runningItems.length > 0) {
			let {task, abort} = this.runningItems.shift()!
			if (abort) {
				await abort()
			}

			this.emit('taskabort', task)
		}
	}

	/** End queue and abort all running and unhandled tasks. Different to `abort()`, queue can be restarted later. */
	async end(): Promise<boolean> {
		if (!(this.state === QueueState.Running || this.state === QueueState.Paused)) {
			return false
		}

		this.state = QueueState.Finished
		this.tasks = []
		this.failedItems = []
		await this.abortRunningTasks()
		
		if (this.resumeResolve) {
			this.resumeResolve()
		}

		this.emit('end')
		return true
	}

	/** Push tasks to queue. */
	push(...tasks: T[]) {
		this.assertCanRun()

		this.tasks.push(...tasks)
		this.emit('tasksadded', tasks)

		if (this.state === QueueState.Finished) {
			this.start()
		}

		this.mayHandleNextTask()
	}

	/** Unshift tasks to queue. */
	unshift(...items: T[]) {
		this.assertCanRun()

		this.tasks.unshift(...items)
		this.emit('tasksadded', items)

		if (this.state === QueueState.Finished) {
			this.start()
		}

		this.mayHandleNextTask()
	}

	/** Find first matched task. */
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

	/** Remove tasks, note that it's O(m * n) */
	remove(...tasks: T[]): T[] {
		let removed: T[] = []

		for (let task of tasks) {
			let index = this.runningItems.findIndex(item => item.task === task)
			if (index > -1) {
				this.runningItems.splice(index, 1)
				this.emit('taskabort', task)
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
				index = this.tasks.findIndex(task => task === task)
				if (index > -1) {
					tasks.splice(index, 1)
					removed.push(task)
				}
			}
		}

		this.mayHandleNextTask()

		return removed
	}

	/** Remove all matched tasks */
	removeWhere(fn: (task: T) => boolean): T[] {
		let removed = []
		removed.push(...removeWhere(this.runningItems, item => fn(item.task)).map(obj => obj.task))
		removed.push(...removeWhere(this.failedItems, item => fn(item.task)).map(obj => obj.task))
		removed.push(...removeWhere(this.tasks, task => fn(task)))

		this.mayHandleNextTask()

		return removed
	}
}


/**
 * Run tasks in queue, returns a promise which will be resolved after finished.
 * @param tasks Specify the task array which will be passed to handler in order. 
 * @param handler Specify the handler to handle each task.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueEach<T>(tasks: T[], handler: (task: T) => Promise<void> | void, concurrency?: number): Promise<void> {
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
 * @param tasks Specify the task array which will be passed to handler in order. 
 * @param handler Specify the handler to handle each task. It should returns a value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueMap<T, V>(tasks: T[], handler: (task: T) => Promise<V> | V, concurrency?: number): Promise<V[]> {
	return new Promise((resolve, reject) => {
		let q = new Queue({
			concurrency,
			capture: true,
			tasks,
			handler
		})

		q.on('finish', () => resolve(q.captured))
		q.on('error', reject)
		q.start()
	})
}


/**
 * Run tasks in queue, returns a promise which will be resolved if some tasks match handler.
 * @param tasks Specify the task array which will be passed to handler in order. 
 * @param handler Specify the handler to handle each task. It should returns a boolean value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueSome<T>(tasks: T[], handler: (task: T) => Promise<boolean> | boolean, concurrency?: number): Promise<boolean> {
	return new Promise((resolve, reject) => {
		let q = new Queue({
			concurrency,
			capture: true,
			tasks,
			handler
		})

		q.on('taskfinish', (task: T, value: boolean) => {
			if (value) {
				resolve(true)
				q.end()
			}
		})

		q.on('finish', () => resolve(false))
		q.on('error', reject)
		q.start()
	})
}


/**
 * Run tasks in queue, returns a promise which will be resolved if every tasks match handler.
 * @param tasks Specify the task array which will be passed to handler in order. 
 * @param handler Specify the handler to handle each task. It should returns a boolean value.
 * @param concurrency Specify how many tasks to run simultaneously.
 */
export function queueEvery<T>(tasks: T[], handler: (task: T) => Promise<boolean> | boolean, concurrency?: number): Promise<boolean> {
	return queueSome(
		tasks,
		async (task: T) => !(await handler(task)),
		concurrency
	).then(value => !value)
}