import {DependencyTracker, UpdateQueue, createEffect} from '../../src'


describe('Test effect', () => {

	it('Test effect', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		createEffect(() => {
			DependencyTracker.onGet(a, 'b')
			a.b
			fn()
		})
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 2
		DependencyTracker.onSet(a, 'b')

		await UpdateQueue.untilComplete()
		expect(fn).toHaveBeenCalledTimes(2)
	})
})