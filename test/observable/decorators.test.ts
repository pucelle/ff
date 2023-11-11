import {observable, deepObservable, proxied, computed} from '../../src/observable/decorators'
import {DependencyCapturer} from '../../src/observable/dependency-capturer'


describe('Test observer', () => {

	it('Test observe', () => {
		class A {
			key!: number
			update = jest.fn()
		}
	
		observable(A.prototype, 'key')

		
		let a = new A()
		a.update()

		DependencyCapturer.startCapture(a.update, a)
		a.key
		DependencyCapturer.endCapture()

		a.key = 1
		expect(a.update).toBeCalledTimes(2)

		a.key = 1
		expect(a.update).toBeCalledTimes(2)
	})

	it('Test deepObserve', () => {
		class A {
			key!: {b: number}
			update = jest.fn()
		}
	
		deepObservable(A.prototype, 'key')

		
		let a = new A()
		a.key = {b: 1}
		a.update()

		DependencyCapturer.startCapture(a.update, a)
		a.key
		a.key.b
		DependencyCapturer.endCapture()

		a.key = {b: 2}
		expect(a.update).toBeCalledTimes(2)

		a.key = {b: 2}
		expect(a.update).toBeCalledTimes(2)
	})

	it.only('Test proxied', () => {
		class A {
			key!: {b: number, c: number[]}
			update = jest.fn()
		}
	
		proxied(A.prototype, 'key')

		
		let a = new A()
		a.key = {b: 1, c: [1]}
		a.update()

		function reCapture() {
			DependencyCapturer.startCapture(a.update, a)
			a.key.b
			a.key.c[0]

			// To pass this test,
			// Must change `TwoWaySetMap` to `TwoWaySetWeakMap` at `dependency-capturer.ts`.
			// Because jest env doesn't allow symbol as weak keys.
			// Don't forget to change it back after test finished.
			DependencyCapturer.endCapture()
		}

		reCapture()
		a.key.b = 2
		expect(a.update).toBeCalledTimes(2)

		reCapture()
		a.key.b = 2
		expect(a.update).toBeCalledTimes(2)

		reCapture()
		a.key.c = [2]
		expect(a.update).toBeCalledTimes(3)

		reCapture()
		a.key.c[0] = 3
		expect(a.update).toBeCalledTimes(4)

		reCapture()
		a.key.c.push(3)
		expect(a.update).toBeCalledTimes(5)
	})

	it('Test computed', () => {
		class A {
			v!: number
			get v1() {
				return this.v
			}
			get v2() {
				return this.v1 + 1
			}
		}
	
		proxied(A.prototype, 'v')
		computed(A.prototype, 'v1', Object.getOwnPropertyDescriptor(A.prototype, 'v1')!)
		computed(A.prototype, 'v2', Object.getOwnPropertyDescriptor(A.prototype, 'v2')!)

		
		let a = new A()
		a.v = 1
		expect(a.v1).toEqual(1)
		expect(a.v2).toEqual(2)

		a.v = 2
		expect(a.v1).toEqual(2)
		expect(a.v2).toEqual(3)
	})
})