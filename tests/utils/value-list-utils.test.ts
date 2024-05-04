import {ValueListUtils} from '../../src'


describe('Test ValueListUtils', () => {
	test('unique', () => {
		expect(ValueListUtils.unique([1,2,3,3])).toEqual([1,2,3])
	})

	test('union', () => {
		expect(ValueListUtils.union([1,2,3], [3,4])).toEqual([1,2,3,4])
		expect(ValueListUtils.union([1,2,3], [3,4], [4,5])).toEqual([1,2,3,4,5])
	})

	test('intersect', () => {
		expect(ValueListUtils.intersect([1,2,3], [3,4])).toEqual([3])
		expect(ValueListUtils.intersect([1,2,3], [3,4], [3,4,5])).toEqual([3])
	})

	test('diff', () => {
		expect(ValueListUtils.difference([1,2,3], [3,4])).toEqual([1,2])
		expect(ValueListUtils.difference([1,2,3], [3,4], [2,5])).toEqual([1])
	})

	test('sum', () => {
		expect(ValueListUtils.sum([1,2,3])).toEqual(6)
	})

	test('average', () => {
		expect(ValueListUtils.average([1,2,3])).toEqual(2)
	})

	test('minIndex', () => {
		expect(ValueListUtils.minIndex([1,1,2])).toEqual(0)
		expect(ValueListUtils.minIndex([])).toEqual(-1)
		expect(ValueListUtils.minIndex([Infinity])).toEqual(-1)
	})

	test('maxIndex', () => {
		expect(ValueListUtils.maxIndex([1,2,2])).toEqual(1)
		expect(ValueListUtils.maxIndex([])).toEqual(-1)
		expect(ValueListUtils.maxIndex([-Infinity])).toEqual(-1)
	})

	test('minOf', () => {
		expect(ValueListUtils.minOf([1,1,2])).toEqual(1)
		expect(ValueListUtils.minOf([])).toEqual(null)
		expect(ValueListUtils.minOf([Infinity])).toEqual(null)
	})

	test('maxOf', () => {
		expect(ValueListUtils.maxOf([1,2,2])).toEqual(2)
		expect(ValueListUtils.maxOf([])).toEqual(null)
		expect(ValueListUtils.maxOf([-Infinity])).toEqual(null)
	})

	test('binaryFindInsertIndex', () => {
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 0)).toEqual(0)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 1)).toEqual(1)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 2)).toEqual(2)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 3)).toEqual(3)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 4)).toEqual(3)
	})

	test('binaryFindLowerInsertIndex', () => {
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 0)).toEqual(0)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 1)).toEqual(0)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 2)).toEqual(1)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 3)).toEqual(2)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 4)).toEqual(3)
	})

	test('binaryFind', () => {
		expect(ValueListUtils.binaryFind([1,2,3], 0)).toEqual(undefined)
		expect(ValueListUtils.binaryFind([1,2,3], 1)).toEqual(1)
		expect(ValueListUtils.binaryFind([1,2,3], 2)).toEqual(2)
		expect(ValueListUtils.binaryFind([1,2,3], 3)).toEqual(3)
		expect(ValueListUtils.binaryFind([1,2,3], 4)).toEqual(undefined)
	})

	test('binaryInsert', () => {
		expect(ValueListUtils.binaryInsert([1,2,3], 0)).toEqual(0)
		expect(ValueListUtils.binaryInsert([1,2,3], 1)).toEqual(1)
		expect(ValueListUtils.binaryInsert([1,2,3], 2)).toEqual(2)
		expect(ValueListUtils.binaryInsert([1,2,3], 3)).toEqual(3)
		expect(ValueListUtils.binaryInsert([1,2,3], 4)).toEqual(3)
	})
})
