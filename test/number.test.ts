import * as ff from '../src'


describe('Test number', () => {
	test('toPower', () => {
		expect(ff.toPower(123.456)).toEqual(123)
		expect(ff.toPower(123.456, -2)).toEqual(123.46)
		expect(ff.toPower(123.456, 2)).toEqual(100)
		expect(ff.toPower(123.456, 3)).toEqual(100)
		expect(ff.toPower(0.456, 0)).toEqual(0.5)
	})

	test('mod', () => {
		expect(ff.mod(-1, 3)).toEqual(2)
	})

	test('constrain', () => {
		expect(ff.constrain(5, 1, 10)).toEqual(5)
		expect(ff.constrain(-1, 1, 10)).toEqual(1)
		expect(ff.constrain(11, 1, 10)).toEqual(10)
		expect(ff.constrain(-1, 10, 1)).toEqual(1)
		expect(ff.constrain(11, 10, 1)).toEqual(10)
	})
})