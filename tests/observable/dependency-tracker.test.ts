import {beginTrack, endTrack, trackGet, trackSet} from '../../src'


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
			beginTrack(a.update, a)

			a.key.b
			trackGet(a, 'key')
			trackGet(a.key, 'b')

			a.key.c.length
			trackGet(a, 'key')
			trackGet(a.key, 'c')
			trackGet(a.key.c, '')

			endTrack()
		}

		reCapture()
		a.key.b = 2
		trackSet(a.key, 'b')
		expect(a.update).toHaveBeenCalledTimes(2)

		reCapture()
		a.key.c = [2]
		trackSet(a.key, 'c')
		expect(a.update).toHaveBeenCalledTimes(3)

		reCapture()
		a.key.c[0] = 3
		trackSet(a.key.c, '')
		expect(a.update).toHaveBeenCalledTimes(4)

		reCapture()
		a.key.c.push(3)
		trackSet(a.key.c, '')
		expect(a.update).toHaveBeenCalledTimes(5)
	})
})