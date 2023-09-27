import {observe, deepObserve, proxiedObserve, computed} from '../../src/observer/decorators'
import {DependencyCapturer} from '../../src/observer/dependency-capturer'


describe('Test observer', () => {

	it('Test observe', () => {
		class A {
			key!: number
			update = jest.fn()
		}
	
		observe(A.prototype, 'key')

		
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
	
		deepObserve(A.prototype, 'key')

		
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

	it('Test proxiedObserve', () => {
		class A {
			key!: {b: number}
			update = jest.fn()
		}
	
		proxiedObserve(A.prototype, 'key')

		
		let a = new A()
		a.key = {b: 1}
		a.update()

		DependencyCapturer.startCapture(a.update, a)
		a.key.b
		DependencyCapturer.endCapture()

		a.key.b = 2
		expect(a.update).toBeCalledTimes(2)

		a.key.b = 2
		expect(a.update).toBeCalledTimes(2)
	})

	it('Test computed', () => {
		class A {
			key!: number
			get com() {
				return this.key
			}
		}
	
		proxiedObserve(A.prototype, 'key')
		computed(A.prototype, 'com', Object.getOwnPropertyDescriptor(A.prototype, 'com')!)

		
		let a = new A()
		a.key = 1
		expect(a.com).toEqual(1)

		a.key = 2
		expect(a.com).toEqual(2)
	})
})