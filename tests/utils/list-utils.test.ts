import {ListUtils, ObjectUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test ListUtils', () => {
	it('unique', () => {
		expect(ListUtils.unique([1,2,3,3])).toEqual([1,2,3])
	})

	it('union', () => {
		expect(ListUtils.union([1,2,3], [3,4])).toEqual([1,2,3,4])
		expect(ListUtils.union([1,2,3], [3,4], [4,5])).toEqual([1,2,3,4,5])
	})

	it('intersect', () => {
		expect(ListUtils.intersect([1,2,3], [3,4])).toEqual([3])
		expect(ListUtils.intersect([1,2,3], [3,4], [3,4,5])).toEqual([3])
	})

	it('diff', () => {
		expect(ListUtils.difference([1,2,3], [3,4])).toEqual([1,2])
		expect(ListUtils.difference([1,2,3], [3,4], [2,5])).toEqual([1])
	})

	it('repeatForTimes', () => {
		expect(ListUtils.repeatForTimes(1, 3)).toEqual([1,1,1])
		expect(ListUtils.repeatForTimes('a', 3)).toEqual(['a', 'a', 'a'])
	})

	it('add', () => {
		expect(ListUtils.add([1,2,3], 4)).toEqual([1,2,3,4])
		expect(ListUtils.add([1,2,3], 3)).toEqual([1,2,3])
	})

	it('remove', () => {
		expect(ListUtils.remove([1,2,3], 4)).toEqual([])
		expect(ListUtils.remove([1,2,3], 3)).toEqual([3])
	})

	it('clean', () => {
		expect(ListUtils.clean([1,2,3,null])).toEqual([1,2,3])
		expect(ListUtils.clean([1,2,3,undefined])).toEqual([1,2,3])
		expect(ListUtils.clean([0,''])).toEqual([0,''])
	})

	it('removeFirstMatch', () => {
		expect(ListUtils.removeFirstMatch([1,2,3,3], (v) => v === 3)).toEqual(3)
		expect(ListUtils.removeFirstMatch([1,2,3], (v) => v === 4)).toEqual(undefined)
	})

	it('removeWhere', () => {
		expect(ListUtils.removeWhere([1,2,3,3], (v) => v === 3)).toEqual([3,3])
		expect(ListUtils.removeWhere([1,2,3], (v) => v === 4)).toEqual([])
	})

	it('indexBy', () => {
		expect(ObjectUtils.objectFromMap(ListUtils.indexBy([1,2,3], (v) => [String(v), v]))).toEqual({1:1, 2:2, 3:3})
		expect(ObjectUtils.objectFromMap(ListUtils.indexBy([1,2,3], (v) => [String(v), v + v]))).toEqual({1:2, 2:4, 3:6})
		expect(ObjectUtils.objectFromMap(ListUtils.indexBy([1,2,3], (v) => [String(v), true]))).toEqual({1:true, 2:true, 3:true})
	})

	it('groupBy', () => {
		expect(ObjectUtils.objectFromMap(ListUtils.groupBy([{a:1}, {a:2}, {a:2}], x => [x.a, x]))).toEqual({1:[{a:1}], 2:[{a:2}, {a:2}]})
		expect(ObjectUtils.objectFromMap(ListUtils.groupBy([0,1,2,3,4,5,6,7,8,9], x => [x % 3, x]))).toEqual({0:[0,3,6,9], 1:[1,4,7], 2:[2,5,8]})
	})

	it('orderBy', () => {
		expect(ListUtils.orderBy([3,2,1], {by: v => v})).toEqual([1,2,3])
		expect(ListUtils.orderBy([3,2,1], {by: v => v, direction: 1})).toEqual([1,2,3])
		expect(ListUtils.orderBy([1,2,3], {by: v => v, direction: -1})).toEqual([3,2,1])

		expect(ListUtils.orderBy([{a:2}, {a:1}], {by: 'a'})).toEqual([{a:1}, {a:2}])
		expect(ListUtils.orderBy([{a:1, b:2}, {a:1, b:1}], {by: 'a', direction: 1}, {by: 'b'})).toEqual([{a:1,b:1}, {a:1,b:2}])
		expect(ListUtils.orderBy([{a:1, b:2}, {a:1, b:1}], {by: 'a', direction: 1}, {by: 'b', direction: -1})).toEqual([{a:1,b:2}, {a:1,b:1}])

		expect(ListUtils.orderBy([2, 1, null], {by: v => v ?? -Infinity})).toEqual([null, 1, 2])
	})

	it('minIndex', () => {
		expect(ListUtils.minIndex([1,1,2], x => x)).toEqual(0)
		expect(ListUtils.minIndex([{a:1}, {a:1}, {a:2}], x => x.a)).toEqual(0)
		expect(ListUtils.minIndex([], x => x)).toEqual(-1)
		expect(ListUtils.minIndex([Infinity], x => x)).toEqual(-1)
	})

	it('maxIndex', () => {
		expect(ListUtils.maxIndex([1,2,2], x => x)).toEqual(1)
		expect(ListUtils.maxIndex([{a:1}, {a:2}, {a:2}], x => x.a)).toEqual(1)
		expect(ListUtils.maxIndex([], x => x)).toEqual(-1)
		expect(ListUtils.maxIndex([-Infinity], x => x)).toEqual(-1)
	})

	it('minOf', () => {
		expect(ListUtils.minOf([1,1,2], x => x)).toEqual(1)
		expect(ListUtils.minOf([{a:1}, {a:1}, {a:2}], x => x.a)).toEqual({a:1})
		expect(ListUtils.minOf([], x => x)).toEqual(null)
		expect(ListUtils.minOf([Infinity], x => x)).toEqual(null)
	})

	it('maxOf', () => {
		expect(ListUtils.maxOf([1,2,2], x => x)).toEqual(2)
		expect(ListUtils.maxOf([{a:1}, {a:2}, {a:2}], x => x.a)).toEqual({a:2})
		expect(ListUtils.maxOf([], x => x)).toEqual(null)
		expect(ListUtils.maxOf([-Infinity], x => x)).toEqual(null)
	})

	it('binaryFindInsertIndex', () => {
		expect(ListUtils.binaryFindInsertIndex([1,2,3], 0, (a, b) => a - b)).toEqual(0)
		expect(ListUtils.binaryFindInsertIndex([1,2,3], 1, (a, b) => a - b)).toEqual(1)
		expect(ListUtils.binaryFindInsertIndex([1,2,3], 2, (a, b) => a - b)).toEqual(2)
		expect(ListUtils.binaryFindInsertIndex([1,2,3], 3, (a, b) => a - b)).toEqual(3)
		expect(ListUtils.binaryFindInsertIndex([1,2,3], 4, (a, b) => a - b)).toEqual(3)
	})

	it('binaryFindLowerInsertIndex', () => {
		expect(ListUtils.binaryFindLowerInsertIndex([1,2,3], 0, (a, b) => a - b)).toEqual(0)
		expect(ListUtils.binaryFindLowerInsertIndex([1,2,3], 1, (a, b) => a - b)).toEqual(0)
		expect(ListUtils.binaryFindLowerInsertIndex([1,2,3], 2, (a, b) => a - b)).toEqual(1)
		expect(ListUtils.binaryFindLowerInsertIndex([1,2,3], 3, (a, b) => a - b)).toEqual(2)
		expect(ListUtils.binaryFindLowerInsertIndex([1,2,3], 4, (a, b) => a - b)).toEqual(3)
	})

	it('binaryFind', () => {
		expect(ListUtils.binaryFind([1,2,3], 0, (a, b) => a - b)).toEqual(undefined)
		expect(ListUtils.binaryFind([1,2,3], 1, (a, b) => a - b)).toEqual(1)
		expect(ListUtils.binaryFind([1,2,3], 2, (a, b) => a - b)).toEqual(2)
		expect(ListUtils.binaryFind([1,2,3], 3, (a, b) => a - b)).toEqual(3)
		expect(ListUtils.binaryFind([1,2,3], 4, (a, b) => a - b)).toEqual(undefined)
	})

	it('binaryInsert', () => {
		expect(ListUtils.binaryInsert([1,2,3], 0, (a, b) => a - b)).toEqual(0)
		expect(ListUtils.binaryInsert([1,2,3], 1, (a, b) => a - b)).toEqual(1)
		expect(ListUtils.binaryInsert([1,2,3], 2, (a, b) => a - b)).toEqual(2)
		expect(ListUtils.binaryInsert([1,2,3], 3, (a, b) => a - b)).toEqual(3)
		expect(ListUtils.binaryInsert([1,2,3], 4, (a, b) => a - b)).toEqual(3)
	})

	it('quickBinaryFindInsertIndex', () => {
		expect(ListUtils.quickBinaryFindInsertIndex([1,2,3], (a) => a - 0)).toEqual(0)
		expect(ListUtils.quickBinaryFindInsertIndex([1,2,3], (a) => a - 1)).toEqual(1)
		expect(ListUtils.quickBinaryFindInsertIndex([1,2,3], (a) => a - 2)).toEqual(2)
		expect(ListUtils.quickBinaryFindInsertIndex([1,2,3], (a) => a - 3)).toEqual(3)
		expect(ListUtils.quickBinaryFindInsertIndex([1,2,3], (a) => a - 4)).toEqual(3)
	})

	it('quickBinaryFindLowerInsertIndex', () => {
		expect(ListUtils.quickBinaryFindLowerInsertIndex([1,2,3], (a) => a - 0)).toEqual(0)
		expect(ListUtils.quickBinaryFindLowerInsertIndex([1,2,3], (a) => a - 1)).toEqual(0)
		expect(ListUtils.quickBinaryFindLowerInsertIndex([1,2,3], (a) => a - 2)).toEqual(1)
		expect(ListUtils.quickBinaryFindLowerInsertIndex([1,2,3], (a) => a - 3)).toEqual(2)
		expect(ListUtils.quickBinaryFindLowerInsertIndex([1,2,3], (a) => a - 4)).toEqual(3)
	})

	it('quickBinaryFind', () => {
		expect(ListUtils.quickBinaryFind([1,2,3], (a) => a - 0)).toEqual(undefined)
		expect(ListUtils.quickBinaryFind([1,2,3], (a) => a - 1)).toEqual(1)
		expect(ListUtils.quickBinaryFind([1,2,3], (a) => a - 2)).toEqual(2)
		expect(ListUtils.quickBinaryFind([1,2,3], (a) => a - 3)).toEqual(3)
		expect(ListUtils.quickBinaryFind([1,2,3], (a) => a - 4)).toEqual(undefined)
	})
})