import {NumberUtils} from '../../src/utils/number'


describe('Test number', () => {
	test('toDecimal', () => {
		expect(NumberUtils.toDecimal(123.456)).toEqual(123)
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
		expect(NumberUtils.closeTo(-1, -1)).toEqual(true)
		expect(NumberUtils.closeTo(-1, 0)).toEqual(false)
	})

	test('mayZero', () => {
		expect(NumberUtils.mayZero(-1)).toEqual(-1)
		expect(NumberUtils.mayZero(0)).toEqual(0)
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