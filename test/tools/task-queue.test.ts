import {TaskQueue, TaskQueueState, sleep} from '../../src'


describe('Test queue', () => {
	let a = [0,1,2,3,4,5,6,7,8,9]
	
	test('each', async () => {
		let fn = jest.fn()
		await TaskQueue.each(a, fn, 2)
		expect(fn).toHaveBeenCalledTimes(a.length)
		expect(fn.mock.calls).toEqual(a.map(i => [i]))
	})

	test('map', async () => {
		let fn = jest.fn(async (i) => {await sleep(); return i})
		let values = await TaskQueue.map(a, fn, 2)
		expect(fn).toHaveBeenCalledTimes(a.length)
		expect(fn.mock.calls).toEqual(a.map(i => [i]))
		expect(values).toEqual(a)
	})

	test('some', async () => {
		let fn = jest.fn(i => i >= 5)
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

	test('every', async () => {
		let fn = jest.fn(i => i <= 9)
		expect(await TaskQueue.every(a, fn, 2)).toEqual(true)
		expect(fn.mock.calls.length).toEqual(a.length)
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.results[i].value).toEqual(true)
		}
	})

	test('start and finish', async () => {
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

	test('Empty queue will finish immediately', async () => {
		let q = new TaskQueue({
			concurrency: 2,
			data: [],
			handler: () => undefined
		})

		q.start()
		await sleep(10)
		expect(q.state).toEqual(TaskQueueState.Finished)
	})

	test('pause and resume', async () => {
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

	test('abort', async () => {
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

	test('Tasks can be abort', async () => {
		let abort = jest.fn()

		let q = new TaskQueue({
			concurrency: 2,
			data: a,
			handler: () => {
				return {
					promise: sleep(),
					abort
				}
			}
		})

		q.start()
		expect(q.abort()).toEqual(true)
		expect(abort).toHaveBeenCalledTimes(2)
	})

	test('retry', async () => {
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

	test('clear', async () => {
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

	test('push and unshift', async () => {
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

	test('find and remove', async () => {
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

	test('removeWhere', async () => {
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

	test('Can get right count', async () => {
		let q = new TaskQueue({
			concurrency: 2,
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
		expect(q.runningCount).toEqual(2)
		expect(q.runningTaskData).toEqual([0, 1])

		await (new Promise(resolve => {
			q.on('taskfinished', (n: number) => {
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

	test('Failed queue', async () => {
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

	test('maxRetryTimes > 0', async () => {
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