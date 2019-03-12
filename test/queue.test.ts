import * as ff from '../src'


describe('Test queue', async () => {
	let a = [0,1,2,3,4,5,6,7,8,9]
	
	test('queueEach', async () => {
		let fn = jest.fn()
		await ff.queueEach(a, fn, 3)
		expect(fn).toBeCalledTimes(a.length)
		for (let i of a) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
	})

	test('queueMap', async () => {
		let fn = jest.fn(async (i) => {await ff.sleep(); return i * i})
		let values = await ff.queueMap(a, fn, 3)
		expect(fn).toBeCalledTimes(a.length)
		for (let i of a) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i of a) {
			expect(values[i]).toEqual(i * i)
		}
	})

	test('queueSome', async () => {
		let fn = jest.fn(i => i >= 5)
		expect(await ff.queueSome(a, fn, 3)).toEqual(true)
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
		expect(await ff.queueEvery(a, fn, 3)).toEqual(true)
		expect(fn.mock.calls.length).toEqual(a.length)
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.calls[i]).toEqual([i])
		}
		for (let i = 0; i < fn.mock.calls.length; i++) {
			expect(fn.mock.results[i].value).toEqual(true)
		}
	})

	test('Can start and finish', async () => {
		let q = new ff.Queue({
			tasks: a,
			handler: () => undefined
		})

		expect(q.canRun()).toEqual(true)
		expect(q.start()).toEqual(true)
		expect(q.canRun()).toEqual(true)

		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Finished)
		expect(q.canRun()).toEqual(true)
	})

	test('Can pause and resume', async () => {
		let q = new ff.Queue({
			tasks: a,
			handler: (n) => undefined
		})

		q.start()
		expect(q.pause()).toEqual(true)
		expect(q.pause()).toEqual(false)
		await ff.sleep(10)
		expect(q.resume()).toEqual(true)
		expect(q.resume()).toEqual(false)
	})

	test('Can end', async () => {
		let q = new ff.Queue({
			tasks: a,
			handler: () => undefined
		})

		expect(q.start()).toEqual(true)
		expect(await q.end()).toEqual(true)
		expect(await q.end()).toEqual(false)
	})

	test('Can add', async () => {
		let q = new ff.Queue({
			tasks: a,
			concurrency: 1,
			fifo: false,
			handler: (n) => undefined
		})

		q.start()
		await ff.sleep(10)

		expect(q.state).toEqual(ff.QueueState.Finished)
		q.push(10)
		expect(q.state).toEqual(ff.QueueState.Running)

		await ff.sleep(10)
		expect(q.state).toEqual(ff.QueueState.Finished)
		q.unshift(10)
		expect(q.state).toEqual(ff.QueueState.Running)
	})

	test('Can find or remove', async () => {
		let q = new ff.Queue({
			tasks: a,
			fifo: false,
			handler: async (n) => {
				if (n === 5) {
					expect(q.find(n => n === 5)).toEqual([5])
					expect(q.remove(n)).toEqual([5])
				}
				if (n === 6) {
					throw ''
				}
			}
		})

		q.start()
		q.on('error', () => {})
		expect(q.find(n => n === 4)).toEqual(4)
		expect(q.remove(4)).toEqual([4])
		expect(q.find(n => n === 10)).toEqual(undefined)
		expect(q.remove(10)).toEqual([])
		await ff.sleep(10)

		expect(q.find(n => n === 6)).toEqual(6)
		expect(q.remove(6)).toEqual([6])
	})

	test('Can removeWhere', async () => {
		let q = new ff.Queue({
			tasks: a,
			fifo: false,
			handler: async (n) => {
				if (n === 5) {
					expect(q.removeWhere(n => n === 5)).toEqual(5)
				}
				if (n === 6) {
					throw ''
				}
			}
		})

		q.start()
		q.on('error', () => {})
		expect(q.removeWhere(n => n === 4)).toEqual([4])
		expect(q.removeWhere(n => n === 10)).toEqual([])
		await ff.sleep(10)
		
		expect(q.removeWhere(n => n === 6)).toEqual([6])
	})

	test('Empty queue will finish immediately', async () => {
		let q = new ff.Queue({
			tasks: [],
			handler: () => undefined
		})

		q.start()
		expect(q.state).toEqual(ff.QueueState.Finished)
	})

	test('Can get right count', async () => {
		let q = new ff.Queue({
			tasks: a,
			maxRetryTimes: 0,
			concurrency: 1,
			handler: async (n) => {
				if (n === 6) {
					throw ''
				}
			}
		})

		q.start()
		expect(q.getRunningCount()).toEqual(1)
		expect(q.getRunningTasks()).toEqual([0])

		await new Promise(resolve => {
			q.on('taskfinish', n => {
				if (n === 5) {
					q.pause()
					resolve()
				}
			})
		})

		expect(q.getUnhandledCount()).toEqual(4)
		expect(q.getUnhandledTasks()).toEqual([6,7,8,9])

		q.resume()
		await ff.sleep(10)

		expect(q.getTotalCount()).toEqual(a.length)
		expect(q.getFailedCount()).toEqual(1)
		expect(q.getFailedTasks()).toEqual([6])
		expect(q.getHandledCount()).toEqual(a.length - 1)
	})

	test('Queue will fail', async () => {
		let q = new ff.Queue({
			tasks: a,
			concurrency: 1,
			handler: async (n) => {
				if (n === 5) {
					throw ''
				}
			}
		})
		
		
	})
})