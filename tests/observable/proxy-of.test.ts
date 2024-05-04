import {DependencyTracker, proxyOf} from '../../src'


describe('Test proxyOf', () => {
	
	it('Test proxyOf', () => {
		let a = proxyOf({b: 1, c: [1]})
		let update = jest.fn()

		function reCapture() {
			DependencyTracker.beginTrack(update)
			a.b
			a.c.length

			// To pass this test,
			// Must change `TwoWaySetMap` to `TwoWaySetWeakMap` at `dependency-capturer.ts`.
			// Because jest env doesn't allow symbol as weak keys.
			// Don't forget to change it back after test finished.
			DependencyTracker.endTrack()
		}

		reCapture()
		a.b = 2
		expect(update).toHaveBeenCalledTimes(1)

		reCapture()
		a.b = 2
		expect(update).toHaveBeenCalledTimes(1)

		reCapture()
		a.c = [2]
		expect(update).toHaveBeenCalledTimes(2)

		reCapture()
		a.c[0] = 3
		expect(update).toHaveBeenCalledTimes(3)

		reCapture()
		a.c.push(3)
		expect(update).toHaveBeenCalledTimes(4)
	})


	it('Test proxyOf comparsion', () => {
		let a = {}
		let b = proxyOf(a)

		expect(a === b).toEqual(false)
		expect(proxyOf(b) === b).toEqual(true)
	})
})