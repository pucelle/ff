import * as ff from '../../src'


describe('Test queue', () => {
	let a = [0,1,2,3,4,5,6,7,8,9]
	
	test('queueEach', async () => {
		let fn = jest.fn()
		await ff.queueEach(a, fn, 2)
		expect(fn).toBeCalledTimes(a.length)
		expect(fn.mock.calls).toEqual(a.map(i => [i]))
	})

	test('queueMap', async () => {
		let fn = jest.fn(async (i) => {await ff.sleep(); return i})
		let values = await ff.queueMap(a, fn, 2)
		expect(fn).toBeCalledTimes(a.length)
		expect(fn.mock.calls).toEqual(a.map(i => [i]))
		expect(values).toEqual(a)
	})

	test('queueSome', async () => {
		let fn = jest.fn(i => i >= 5)
		expect(await ff.queueSome(a, fn, 2)).toEqual(true)
		expect(fn.mock.calls.length).toBeGreaterThan(5)
		expect(fn.mock.calls.length).toBeLessThan(a.length)
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.results[i].value).toEqual(i >= 5 ? true: false)
		}
	})

	test('queueEvery', async () => {
		let fn = jest.fn(i => i <= 9)
		expect(await ff.queueEvery(a, fn, 2)).toEqual(true)
		expect(fn.mock.calls.length).toEqual(a.length)
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.results[i].value).toEqual(true)
		}
	})

	test('start and finish', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: () => undefined
		})

		expect(q.state).toEqual(ff.QueueState.Pending)
		expect(q.start()).toEqual(true)
		expect(q.state).toEqual(ff.QueueState.Running)

		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Finish)
	})

	test('Empty queue will finish immediately', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: [],
			handler: () => undefined
		})

		q.start()
		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Finish)
	})

	test('pause and resume', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: () => undefined
		})

		q.start()
		expect(q.pause()).toEqual(true)
		expect(q.pause()).toEqual(false)
		await ff.sleep(10)
		expect(q.resume()).toEqual(true)
		expect(q.resume()).toEqual(false)

		expect(q.pause()).toEqual(true)
		expect(q.start()).toEqual(true)
	})

	test('abort', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: () => undefined
		})

		q.start()
		expect(q.abort()).toEqual(true)
		expect(q.abort()).toEqual(false)
		expect(q.getTotalCount()).toEqual(a.length)
		expect(q.getFailedCount()).toEqual(2)
		expect(q.start()).toEqual(true)
		q.pause()
		expect(q.abort()).toEqual(true)
	})

	test('Tasks can be abort', async () => {
		let abort = jest.fn()

		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: () => {
				return {
					promise: ff.sleep(),
					abort
				}
			}
		})

		q.start()
		expect(q.abort()).toEqual(true)
		expect(abort).toBeCalledTimes(2)
	})

	test('retry', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: () => undefined
		})

		q.start()
		q.abort()
		expect(q.retry()).toEqual(true)
		expect(q.getTotalCount()).toEqual(a.length)
		expect(q.getFailedCount()).toEqual(0)
		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Finish)
	})

	test('clear', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: (n) => {
				if (n === 5) {
					q.pause()
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})

		q.start()
		await ff.sleep(10)
		expect(q.clear()).toEqual(true)
		expect(q.getTotalCount()).toEqual(0)

		q.push(...a)
		q.pause()
		expect(q.clear()).toEqual(true)
	})

	test('push and unshift', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: () => undefined
		})

		q.start()
		await ff.sleep(10)

		expect(q.state).toEqual(ff.QueueState.Finish)
		q.push(10)
		q.start()
		expect(q.state).toEqual(ff.QueueState.Running)

		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Finish)
		q.unshift(10)
		q.start()
		expect(q.state).toEqual(ff.QueueState.Running)
	})

	test('find and remove', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
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
		await ff.sleep(10)

		expect(q.find(n => n === 6)).toEqual(6)
		expect(q.remove(6)).toEqual([6])
	})

	test('removeWhere', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
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
		await ff.sleep(10)
		
		expect(q.removeWhere(n => n === 6)).toEqual([6])
	})

	test('Can get right count', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			continueOnError: true,
			handler: (n) => {
				if (n === 6) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})

		q.start()
		expect(q.getRunningCount()).toEqual(2)
		expect(q.getRunningTasks()).toEqual([0, 1])

		await (new Promise(resolve => {
			q.on('taskfinish', (n: number) => {
				if (n === 5) {
					q.pause()
					resolve()
				}
			})
		}) as Promise<void>)

		expect(q.getUnprocessedCount()).toEqual(4)
		expect(q.getUnprocessedTasks()).toEqual([6,7,8,9])

		q.resume()
		await ff.sleep(10)

		expect(q.getTotalCount()).toEqual(a.length)
		expect(q.getFailedCount()).toEqual(1)
		expect(q.getFailedTasks()).toEqual([6])
		expect(q.getProcessedCount()).toEqual(a.length - 1)
	})

	test('Failed queue', async () => {
		let q = new ff.Queue({
			concurrency: 2,
			tasks: a,
			handler: (n) => {
				if (n === 5) {
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})
		
		q.start()
		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Aborted)
		expect(q.start()).toEqual(true)
	})

	test('maxRetryTimes > 0', async () => {
		let retried = 0

		let q = new ff.Queue({
			concurrency: 2,
			maxRetryTimes: 1,
			tasks: a,
			handler: () => {
				if (retried < 5) {
					retried++
					return Promise.reject('')
				}
				return Promise.resolve()
			}
		})
		
		q.start()
		await ff.sleep(10)
		expect(retried).toEqual(5)
		expect(q.state).toEqual(ff.QueueState.Finish)
		expect(q.getTotalCount()).toEqual(a.length)
		expect(q.getFailedCount()).toEqual(0)
	})
})