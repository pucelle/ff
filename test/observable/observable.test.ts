import {DependencyTracker, compute, proxyOf} from '../../src/observable'


describe('Test observable', () => {

	it('Test observable', () => {
		class A {
			key!: {b: number, c: number[]}
			update = jest.fn()
		}
	
		let a = new A()
		a.key = {b: 1, c: [1]}
		a.update()

		function reCapture() {
			DependencyTracker.beginTrack(a.update, a)

			a.key.b
			DependencyTracker.onGet(a, 'key')
			DependencyTracker.onGet(a.key, 'b')

			a.key.c.length
			DependencyTracker.onGet(a, 'key')
			DependencyTracker.onGet(a.key, 'c')
			DependencyTracker.onGet(a.key.c)

			DependencyTracker.endTrack()
		}

		reCapture()
		a.key.b = 2
		DependencyTracker.onSet(a.key, 'b')
		expect(a.update).toHaveBeenCalledTimes(2)

		reCapture()
		a.key.c = [2]
		DependencyTracker.onSet(a.key, 'c')
		expect(a.update).toHaveBeenCalledTimes(3)

		reCapture()
		a.key.c[0] = 3
		DependencyTracker.onSet(a.key.c)
		expect(a.update).toHaveBeenCalledTimes(4)

		reCapture()
		a.key.c.push(3)
		DependencyTracker.onSet(a.key.c)
		expect(a.update).toHaveBeenCalledTimes(5)
	})

	
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



	// it('Test watch', () => {
	// 	let a = proxyOf({b: 1, c: [1]})
	// 	let update = jest.fn()

	// 	Watcher.watch(() => {a.b, a.c[0]}, update)

	// 	a.b = 2
	// 	expect(update).toHaveBeenCalledTimes(1)

	// 	a.b = 2
	// 	expect(update).toHaveBeenCalledTimes(1)

	// 	a.c = [2]
	// 	expect(update).toHaveBeenCalledTimes(2)

	// 	a.c[0] = 3
	// 	expect(update).toHaveBeenCalledTimes(3)

	// 	a.c.push(3)
	// 	expect(update).toHaveBeenCalledTimes(4)
	// })


	it('Test compute', () => {
		class A {
			v!: number
			get v1() {
				return this.v
			}
			get v2() {
				return this.v1 + 1
			}
		}

		let a = new A()
		let v1 = compute(() => {DependencyTracker.onGet(a, 'v'); return a.v})
		let v2 = compute(() => {DependencyTracker.onGet(a, 'v'); return a.v + 1})

		a.v = 1
		DependencyTracker.onSet(a, 'v')
		expect(v1()).toEqual(1)
		expect(v2()).toEqual(2)

		a.v = 2
		DependencyTracker.onSet(a, 'v')
		expect(v1()).toEqual(2)
		expect(v2()).toEqual(3)
	})
})