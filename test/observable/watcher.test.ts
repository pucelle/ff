import {DependencyTracker, UpdateQueue, Watcher} from '../../src'


describe('Test watch', () => {

	it('Test watch', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		Watcher.watch(() => {
			DependencyTracker.onGet(a, 'b')
			return a.b
		}, fn)

		a.b = 2
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})


	it('Test watchImmediately', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		Watcher.watchImmediately(() => {
			DependencyTracker.onGet(a, 'b')
			return a.b
		}, fn)
		
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 2
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(2)
	})


	it('Test watchOnce', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		Watcher.watchOnce(() => {
			DependencyTracker.onGet(a, 'b')
			return a.b
		}, fn)

		a.b = 2
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 3
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})


	it('Test watchUntil', async () => {
		let a = {b: 0}
		let fn = jest.fn()

		Watcher.watchUntil(() => {
			DependencyTracker.onGet(a, 'b')
			return a.b
		}, fn)

		a.b = 0
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(0)

		a.b = 1
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})
})