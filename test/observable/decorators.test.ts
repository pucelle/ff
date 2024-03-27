import {proxied} from '../../src/observable/decorators'
import {DependencyCapturer} from '../../src/observable/dependency-capturer'
import {proxyOf} from '../../src/observable/proxy'


/** 
 * Make a computed value, returns an accessor decoration.
 * and automatically re-computing the value after any dependency changed.
 */
export function computed<V = any>(_target: any, property: string, descriptor: TypedPropertyDescriptor<V>) {
	const originalGetter = descriptor.get!

	const ValueMap: WeakMap<object, V> = new WeakMap()

	const getter = function(this: object) {
		let hasValueSet = ValueMap.has(this)
		let value: V

		// Cached value is OK.
		if (hasValueSet) {
			value = ValueMap.get(this)!
		}

		// Compute new value.
		else {

			// Start to capture dependency.
			DependencyCapturer.startCapture(reset, this)

			try {
				value = originalGetter.call(this)
				ValueMap.set(this, value)
			}
			catch (err) {
				console.warn(err)
			}
			
			// Always end even error occurs.
			finally {
				DependencyCapturer.endCapture()
			}
		}

		// computed value is also an observed value.
		DependencyCapturer.onGet(this, property)

		return value!
	}

	const reset = function(this: object) {
		ValueMap.delete(this)!

		// Reset is nearly equals set it.
		DependencyCapturer.onSet(this, property)
	}

	descriptor.get = getter
}


describe('Test observable', () => {

	it('Test proxied', () => {
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
			a.key.c.length

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

	it('Test proxyOf', () => {
		let a = {}
		let b = proxyOf(a)

		expect(a === b).toEqual(false)
		expect(proxyOf(b) === b).toEqual(true)
	})
})