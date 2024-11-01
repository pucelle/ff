import {createImmediateWatch, createOnceWatch, createWatch, createWatchUntil, trackGet, trackSet, untilUpdateComplete} from '../../src'


describe('Test watch', () => {

	it('Test watch', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		createWatch(() => {
			trackGet(a, 'b')
			return a.b
		}, fn)

		a.b = 2
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})


	it('Test watchImmediately', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		createImmediateWatch(() => {
			trackGet(a, 'b')
			return a.b
		}, fn)
		
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 2
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)
	})


	it('Test watchOnce', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		createOnceWatch(() => {
			trackGet(a, 'b')
			return a.b
		}, fn)

		a.b = 2
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 3
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})


	it('Test watchUntil', async () => {
		let a = {b: 0}
		let fn = jest.fn()

		createWatchUntil(() => {
			trackGet(a, 'b')
			return a.b
		}, fn)

		a.b = 0
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(0)

		a.b = 1
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})
})