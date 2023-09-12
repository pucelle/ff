import * as ff from '../../src'


describe('Test object', () => {
	let a = {a: 1, b: "2", c: false, d: [3, {d: 4}], e: {f: 4}}
	let b = JSON.parse(JSON.stringify(a))

	test('assign', () => {
		expect(ff.assign({}, {a:1})).toEqual({a:1})
		expect(ff.assign({}, {a:undefined})).toEqual({})
		expect(ff.assign({}, {a:1,b:2}, ['a'])).toEqual({a:1})
	})

	test('deepClone', () => {
		expect(ff.deepClone(a)).toEqual(a)
		expect(ff.deepClone(a.a)).toEqual(a.a)
		expect(ff.deepClone(a.b)).toEqual(a.b)
		expect(ff.deepClone(a.c)).toEqual(a.c)
		expect(ff.deepClone(a.d)).toEqual(a.d)
		expect(ff.deepClone(a.e)).toEqual(a.e)
	})

	test('deepEqual', () => {
		expect(ff.deepEqual(a, b, 0)).toEqual(false)
		expect(ff.deepEqual(null, undefined)).toEqual(false)
		expect(ff.deepEqual(new Date(), {})).toEqual(false)

		expect(ff.deepEqual(a, b)).toEqual(true)
		expect(ff.deepEqual(a.a, b.a)).toEqual(true)
		expect(ff.deepEqual(a.b, b.b)).toEqual(true)
		expect(ff.deepEqual(a.c, b.c)).toEqual(true)
		expect(ff.deepEqual(a.d, b.d)).toEqual(true)
		expect(ff.deepEqual(a.e, b.e)).toEqual(true)

		expect(ff.deepEqual(a, {})).toEqual(false)
		expect(ff.deepEqual({}, a)).toEqual(false)
		expect(ff.deepEqual({a:1}, {b:1})).toEqual(false)
		expect(ff.deepEqual({a:{a:1}}, {a:{b:1}})).toEqual(false)
		expect(ff.deepEqual(a.d, [])).toEqual(false)
		expect(ff.deepEqual([], a.d)).toEqual(false)
	})
})