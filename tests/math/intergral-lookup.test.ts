import {IntegralLookup} from '../../src'


describe('Test IntegralLookUp', () => {

	test('IntegralLookUp', () => {
		expect(IntegralLookup.lookupXRateByYRate(0, [3, 5, 6])).toEqual(0)
		expect(IntegralLookup.lookupXRateByYRate(1, [3, 5, 6])).toEqual(1)
		expect(IntegralLookup.lookupXRateByYRate(0.5, [3, 5, 6])).toEqual(1/3)
		expect(IntegralLookup.lookupXRateByYRate(2/3, [3, 5, 6])).toEqual(0.5)

		expect(IntegralLookup.lookupYRateByXRate(0, [3, 5, 6])).toEqual(0)
		expect(IntegralLookup.lookupYRateByXRate(1, [3, 5, 6])).toEqual(1)
		expect(IntegralLookup.lookupYRateByXRate(0.5, [3, 5, 6])).toEqual(2/3)
	})
})