import {RecursiveVariance} from '../../src'


describe('Test RecursiveVariance', () => {

	test('Size RecursiveVariance', () => {
		let rv = new RecursiveVariance()

		rv.update(1)
		expect(rv.average).toEqual(1)
		expect(rv.variance).toEqual(0)
		expect(rv.n).toEqual(1)

		rv.update(2)
		expect(rv.average).toEqual(1.5)
		expect(rv.variance).toEqual(0.25)
		expect(rv.n).toEqual(2)

		rv.update(3)
		expect(rv.average).toEqual(2)
		expect(rv.variance).toBeCloseTo(2/3)
		expect(rv.n).toEqual(3)
	})
})