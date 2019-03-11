import * as ff from '../src'

describe('Test object', () => {
	let a = {a: 1, b: "2", c: false, d: ['3'], e: {f: 4}}
	let b = JSON.parse(JSON.stringify(a))

	test('deepClone', () => {
		expect(ff.deepClone(a)).toEqual(a)
		expect(ff.deepClone(a.a)).toEqual(a.a)
		expect(ff.deepClone(a.b)).toEqual(a.b)
		expect(ff.deepClone(a.c)).toEqual(a.c)
		expect(ff.deepClone(a.d)).toEqual(a.d)
		expect(ff.deepClone(a.e)).toEqual(a.e)
	})

	test('deepEqual', () => {
		expect(ff.deepEqual(a, b)).toBeTruthy()
		expect(ff.deepEqual(a.a, b.a)).toBeTruthy()
		expect(ff.deepEqual(a.b, b.b)).toBeTruthy()
		expect(ff.deepEqual(a.c, b.c)).toBeTruthy()
		expect(ff.deepEqual(a.d, b.d)).toBeTruthy()
		expect(ff.deepEqual(a.e, b.e)).toBeTruthy()
		expect(ff.deepEqual(a, {})).toBeFalsy()
		expect(ff.deepEqual(a.d, [])).toBeFalsy()
	})
})