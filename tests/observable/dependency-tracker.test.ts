import * as DependencyTracker from '../../src/observable/dependency-tracker'


describe('Test DependencyTracker', () => {

	it('Test DependencyTracker', () => {
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
})