import {NumberUtils} from '../../src'


describe('Test NumberUtils', () => {
	test('toDecimal', () => {
		expect(NumberUtils.toDecimal(123.456, 0)).toEqual(123)
		expect(NumberUtils.toDecimal(123.456, 2)).toEqual(123.46)
		expect(NumberUtils.toDecimal(123.456, -2)).toEqual(100)
		expect(NumberUtils.toDecimal(123.456, -3)).toEqual(0)
	})

	test('toPrecision', () => {
		expect(NumberUtils.toPrecision(123.456, 1)).toEqual(100)
		expect(NumberUtils.toPrecision(123.456, 2)).toEqual(120)
	})

	test('euclideanModulo', () => {
		expect(NumberUtils.euclideanModulo(-1, 3)).toEqual(2)
	})

	test('gcd', () => {
		expect(NumberUtils.gcd(1920, 1080)).toEqual(120)
	})

	test('clamp', () => {
		expect(NumberUtils.clamp(5, 1, 10)).toEqual(5)
		expect(NumberUtils.clamp(-1, 1, 10)).toEqual(1)
		expect(NumberUtils.clamp(11, 1, 10)).toEqual(10)
	})

	test('flag', () => {
		expect(NumberUtils.flag(-1)).toEqual(-1)
		expect(NumberUtils.flag(1)).toEqual(1)
		expect(NumberUtils.flag(0)).toEqual(0)
	})

	test('nonZeroFlag', () => {
		expect(NumberUtils.nonZeroFlag(-1)).toEqual(-1)
		expect(NumberUtils.nonZeroFlag(1)).toEqual(1)
		expect(NumberUtils.nonZeroFlag(0)).toEqual(1)
	})

	test('closeTo', () => {
		expect(NumberUtils.nearlyEquals(-1, -1)).toEqual(true)
		expect(NumberUtils.nearlyEquals(-1, 0)).toEqual(false)
	})

	test('mayZero', () => {
		expect(NumberUtils.nearlyZero(-1)).toEqual(-1)
		expect(NumberUtils.nearlyZero(0)).toEqual(0)
	})

	test('mayValue', () => {
		expect(NumberUtils.mayValue(-1, -1)).toEqual(-1)
		expect(NumberUtils.mayValue(-1, 0)).toEqual(-1)
	})

	test('fract', () => {
		expect(NumberUtils.toDecimal(NumberUtils.fract(1.1), 8)).toEqual(0.1)
		expect(NumberUtils.fract(0.9)).toEqual(0.9)
	})
})