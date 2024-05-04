import {IntegralLookup} from '../../src'


describe('Test IntegralLookUp', () => {

	test('IntegralLookUp', () => {
		expect(IntegralLookup.locateIntegralX(0, [3, 5, 6])).toEqual(0)
		expect(IntegralLookup.locateIntegralX(1, [3, 5, 6])).toEqual(3)
		expect(IntegralLookup.locateIntegralX(0.5, [3, 5, 6])).toEqual(1)
		expect(IntegralLookup.locateIntegralX(2/3, [3, 5, 6])).toEqual(1.5)

		expect(IntegralLookup.locateIntegralY(0, [3, 5, 6])).toEqual(0)
		expect(IntegralLookup.locateIntegralY(1, [3, 5, 6])).toEqual(6)
		expect(IntegralLookup.locateIntegralY(0.5, [3, 5, 6])).toEqual(4)
	})
})