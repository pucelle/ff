import {DependencyCapturer, compute} from '../../src/observable'


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
			DependencyCapturer.startCapture(a.update, a)

			a.key.b
			DependencyCapturer.onGet(a, 'key')
			DependencyCapturer.onGet(a.key, 'b')

			a.key.c.length
			DependencyCapturer.onGet(a, 'key')
			DependencyCapturer.onGet(a.key, 'c')
			DependencyCapturer.onGet(a.key.c)

			DependencyCapturer.endCapture()
		}

		reCapture()
		a.key.b = 2
		DependencyCapturer.onSet(a.key, 'b')
		expect(a.update).toBeCalledTimes(2)

		reCapture()
		a.key.c = [2]
		DependencyCapturer.onSet(a.key, 'c')
		expect(a.update).toBeCalledTimes(3)

		reCapture()
		a.key.c[0] = 3
		DependencyCapturer.onSet(a.key.c)
		expect(a.update).toBeCalledTimes(4)

		reCapture()
		a.key.c.push(3)
		DependencyCapturer.onSet(a.key.c)
		expect(a.update).toBeCalledTimes(5)
	})

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
		let v1 = compute(() => {DependencyCapturer.onGet(a, 'v'); return a.v})
		let v2 = compute(() => {DependencyCapturer.onGet(a, 'v'); return a.v + 1})

		a.v = 1
		DependencyCapturer.onSet(a, 'v')
		expect(v1()).toEqual(1)
		expect(v2()).toEqual(2)

		a.v = 2
		DependencyCapturer.onSet(a, 'v')
		expect(v1()).toEqual(2)
		expect(v2()).toEqual(3)
	})
})