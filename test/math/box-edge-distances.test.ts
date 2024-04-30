import {Direction, BoxDistances} from '../../src'


describe('Test BoxDistances', () => {

	test('BoxDistances', () => {
		let d = new BoxDistances(10)
		
		expect(d.horizontal).toEqual(20)
		expect(d.vertical).toEqual(20)
		expect(d.getMaximumAbsuluteValue()).toEqual(10)

		d.set(10)
		d.collapse(new BoxDistances(20))
		expect(d.toArray()).toEqual([20, 20, 20, 20])

		d.set(10)
		d.collapseAt(new BoxDistances(20), Direction.Top)
		expect(d.toArray()).toEqual([20, 10, 10, 10])

		d.set(10)
		d.collapseValueBy('top', 20)
		expect(d.top).toEqual(20)

		d.set(10)
		d.collapseValueAt(Direction.Top, 30)
		expect(d.top).toEqual(30)

		d.set(10)
		d = d.pickBy(['top', 'right'])
		expect(d.toArray()).toEqual([10, 10, 0, 0])

		d.set(10)
		d = d.pickAt(Direction.Top)
		expect(d.toArray()).toEqual([10, 0, 0, 0])

		d.set(10)
		d = d.multiplyScalar(2)
		expect(d.toArray()).toEqual([20, 20, 20, 20])

		d.set(10)
		d.multiplyScalarSelf(2)
		expect(d.toArray()).toEqual([20, 20, 20, 20])

		d.reset()
		expect(d.toArray()).toEqual([0, 0, 0, 0])
	})
})