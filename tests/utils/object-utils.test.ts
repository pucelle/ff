import {ObjectUtils, Vector} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test ObjectUtils', () => {
	let a = {a: 1, b: "2", c: false, d: [3, {d: 4}], e: {f: 4}}
	let b = JSON.parse(JSON.stringify(a))

	it('deepClone', () => {
		expect(ObjectUtils.deepClone(a)).toEqual(a)
		expect(ObjectUtils.deepClone(a.a)).toEqual(a.a)
		expect(ObjectUtils.deepClone(a.b)).toEqual(a.b)
		expect(ObjectUtils.deepClone(a.c)).toEqual(a.c)
		expect(ObjectUtils.deepClone(a.d)).toEqual(a.d)
		expect(ObjectUtils.deepClone(a.e)).toEqual(a.e)
	})

	it('deepCloneCloneable', () => {
		expect(ObjectUtils.deepCloneCloneable(new Vector(0, 0)).clone).toBeDefined()
	})

	it('deepEqual', () => {
		expect(ObjectUtils.deepEqual(a, b, 0)).toEqual(false)
		expect(ObjectUtils.deepEqual(null, undefined)).toEqual(false)
		expect(ObjectUtils.deepEqual(new Date(), {})).toEqual(true)

		expect(ObjectUtils.deepEqual(a, b)).toEqual(true)
		expect(ObjectUtils.deepEqual(a.a, b.a)).toEqual(true)
		expect(ObjectUtils.deepEqual(a.b, b.b)).toEqual(true)
		expect(ObjectUtils.deepEqual(a.c, b.c)).toEqual(true)
		expect(ObjectUtils.deepEqual(a.d, b.d)).toEqual(true)
		expect(ObjectUtils.deepEqual(a.e, b.e)).toEqual(true)

		expect(ObjectUtils.deepEqual(a, {})).toEqual(false)
		expect(ObjectUtils.deepEqual({}, a)).toEqual(false)
		expect(ObjectUtils.deepEqual({a:1}, {b:1})).toEqual(false)
		expect(ObjectUtils.deepEqual({a:{a:1}}, {a:{b:1}})).toEqual(false)
		expect(ObjectUtils.deepEqual(a.d, [])).toEqual(false)
		expect(ObjectUtils.deepEqual([], a.d)).toEqual(false)
	})

	it('deepEqualComparable', () => {
		expect(ObjectUtils.deepEqualComparable(new Vector(0, 0), new Vector(0, 0))).toEqual(true)
	})

	it('assign', () => {
		expect(ObjectUtils.assign({}, {a:1})).toEqual({a:1})
		expect(ObjectUtils.assign({}, {a:undefined})).toEqual({})
	})

	it('assignWithKeys', () => {
		expect(ObjectUtils.assignWithKeys({}, {a:1,b:2}, ['a'])).toEqual({a:1})
	})

	it('assignWithoutKeys', () => {
		expect(ObjectUtils.assignWithoutKeys({}, {a:1,b:2}, ['a'])).toEqual({b:2})
	})

	it('deepAssign', () => {
		expect(ObjectUtils.deepAssign({}, {a:1, b:{c:1}})).toEqual({a:1, b:{c:1}})
		expect(ObjectUtils.deepAssign({}, {a:undefined})).toEqual({})
	})

	it('assignNonExisted', () => {
		expect(ObjectUtils.assignNonExisted({}, {a:1})).toEqual({a:1})
		expect(ObjectUtils.assignNonExisted({a:1}, {a:2})).toEqual({a:1})
		expect(ObjectUtils.assignNonExisted({a:undefined}, {a:2})).toEqual({a:2})
		expect(ObjectUtils.assignNonExisted({a:1}, {b:2, c:3}, ['b'])).toEqual({a:1, b:2})
	})

	it('assignExisting', () => {
		expect(ObjectUtils.assignExisting({}, {a:1})).toEqual({})
		expect(ObjectUtils.assignExisting({a:1}, {a:2})).toEqual({a:2})
		expect(ObjectUtils.assignExisting({a:undefined} as any, {a:2})).toEqual({a:undefined})
		expect(ObjectUtils.assignExisting({a:1, b:2}, {a:2, b:3}, ['a'])).toEqual({a:2, b:2})
	})

	it('cleanEmptyValues', () => {
		expect(ObjectUtils.cleanEmptyValues({a: undefined, b: null})).toEqual({})
	})

	it('mapToObject', () => {
		expect(ObjectUtils.objectFromMap(new Map([['a', 1], ['b', 1]]))).toEqual({a:1, b:1})
	})
})