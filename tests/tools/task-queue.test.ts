import {TaskQueue, TaskQueueState, sleep} from '../../src'
import {describe, expect, vi, it} from 'vitest'


describe('Test TaskQueue', () => {
	let a = [0,1,2,3,4,5,6,7,8,9]
	
	it('each', async () => {
		let fn = vi.fn() as any
		await TaskQueue.each(a, fn, 2)
		expect(fn).toHaveBeenCalledTimes(a.length)
		expect(fn.mock.calls).toEqual(a.map(i => [i]))
	})

	it('map', async () => {
		let fn = vi.fn(async (i) => {await sleep(); return i})
		let values = await TaskQueue.map(a, fn, 2)
		expect(fn).toHaveBeenCalledTimes(a.length)
		expect(fn.mock.calls).toEqual(a.map(i => [i]))
		expect(values).toEqual(a)
	})

	it('some', async () => {
		let fn = vi.fn((i: number) => i >= 5)
		expect(await TaskQueue.some(a, fn, 2)).toEqual(true)
		expect(fn.mock.calls.length).toBeGreaterThan(5)
		expect(fn.mock.calls.length).toBeLessThan(a.length)
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.results[i].value).toEqual(i >= 5 ? true: false)
		}
	})

	it('every', async () => {
		let fn = vi.fn((i: number) => i <= 9)
		expect(await TaskQueue.every(a, fn, 2)).toEqual(true)
		expect(fn.mock.calls.length).toEqual(a.length)
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.results[i].value).toEqual(true)
		}
	})

	it('start and finish', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => undefined
		})

		expect(q.state).toEqual(TaskQueueState.Pending)
		expect(q.start()).toEqual(true)
		expect(q.state).toEqual(TaskQueueState.Running)

		await sleep(10)
		expect(q.state).toEqual(TaskQueueState.Finished)
	})

	it('Empty queue will finish immediately', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: [],
			handler: () => undefined
		})

		q.start()
		await sleep(10)
		expect(q.state).toEqual(TaskQueueState.Finished)
	})

	it('pause and resume', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => undefined
		})

		q.start()
		expect(q.pause()).toEqual(true)
		expect(q.pause()).toEqual(false)
		await sleep(10)
		expect(q.resume()).toEqual(true)
		expect(q.resume()).toEqual(false)

		expect(q.pause()).toEqual(true)
		expect(q.start()).toEqual(true)
	})

	it('abort', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => undefined
		})

		q.start()
		expect(q.abort()).toEqual(true)
		expect(q.abort()).toEqual(false)
		expect(q.totalCount).toEqual(a.length)
		expect(q.failedCount).toEqual(2)
		expect(q.start()).toEqual(true)
		q.pause()
		expect(q.abort()).toEqual(true)
	})

	it('Tasks can be abort', async () => {
		let abort = vi.fn()

		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => {
				return sleep(10)
			},
			abortHandler: abort,
		})

		q.start()
		expect(q.abort()).toEqual(true)
		expect(abort).toHaveBeenCalledTimes(2)
	})

	it('retry', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => undefined
		})

		q.start()
		q.abort()
		expect(q.retry()).toEqual(true)
		expect(q.totalCount).toEqual(a.length)
		expect(q.failedCount).toEqual(0)
		await sleep(10)
		expect(q.state).toEqual(TaskQueueState.Finished)
	})

	it('clear', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: (n) => {
				if (n === 5) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})

		q.start()
		await sleep(10)
		q.clear()
		expect(q.failedCount).toEqual(0)
		expect(q.totalCount).toEqual(0)
	})

	it('push and unshift', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => undefined
		})

		q.start()
		await sleep(10)

		expect(q.state).toEqual(TaskQueueState.Finished)
		q.push(10)
		q.start()
		expect(q.state).toEqual(TaskQueueState.Running)

		await sleep(10)
		expect(q.state).toEqual(TaskQueueState.Finished)
		q.unshift(10)
		q.start()
		expect(q.state).toEqual(TaskQueueState.Running)
	})

	it('find and remove', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: (n) => {
				if (n === 6) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})

		q.start()
		expect(q.find(n => n === 4)).toEqual(4)
		expect(q.remove(4)).toEqual([4])
		expect(q.find(n => n === 10)).toEqual(undefined)
		expect(q.remove(10)).toEqual([])
		await sleep(10)

		expect(q.find(n => n === 6)).toEqual(6)
		expect(q.remove(6)).toEqual([6])
	})

	it('removeWhere', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: (n) => {
				if (n === 6) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})

		q.start()
		expect(q.removeWhere(n => n === 4)).toEqual([4])
		expect(q.removeWhere(n => n === 10)).toEqual([])
		await sleep(10)
		
		expect(q.removeWhere(n => n === 6)).toEqual([6])
	})

	it('Can get right count', async () => {
		let q = new TaskQueue({
			concurrency: 1,
			data: a,
			continueOnError: true,
			handler: (n) => {
				if (n === 6) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})

		q.start()
		expect(q.runningCount).toEqual(1)
		expect(q.runningTaskData).toEqual([0])

		await (new Promise(resolve => {
			q.on('task-finished', (n: number) => {
				if (n === 5) {
					q.pause()
					resolve()
				}
			})
		}) as Promise<void>)

		expect(q.unprocessedCount).toEqual(4)
		expect(q.unprocessedTaskData).toEqual([6,7,8,9])

		q.resume()
		await sleep(10)

		expect(q.totalCount).toEqual(a.length)
		expect(q.failedCount).toEqual(1)
		expect(q.failedTaskData).toEqual([6])
		expect(q.processedCount).toEqual(a.length - 1)
	})

	it('Failed queue', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: (n) => {
				if (n === 5) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})
		
		q.start()
		await sleep(10)
		expect(q.state).toEqual(TaskQueueState.Aborted)
		expect(q.start()).toEqual(true)
	})

	it('maxRetryTimes > 0', async () => {
		let retried = 0

		let q = new TaskQueue({
			concurrency: 2,
			maxRetryTimes: 1,
			data: a,
			handler: () => {
				if (retried < 5) {
					retried++
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})
		
		q.start()
		await sleep(10)
		expect(retried).toEqual(5)
		expect(q.state).toEqual(TaskQueueState.Finished)
		expect(q.totalCount).toEqual(a.length)
		expect(q.failedCount).toEqual(0)
	})
})