import {ValueListUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test ValueListUtils', () => {

	it('sum', () => {
		expect(ValueListUtils.sum([1,2,3])).toEqual(6)
	})

	it('average', () => {
		expect(ValueListUtils.average([1,2,3])).toEqual(2)
	})

	it('minIndex', () => {
		expect(ValueListUtils.minIndex([1,1,2])).toEqual(0)
		expect(ValueListUtils.minIndex([])).toEqual(-1)
		expect(ValueListUtils.minIndex([Infinity])).toEqual(-1)
	})

	it('maxIndex', () => {
		expect(ValueListUtils.maxIndex([1,2,2])).toEqual(1)
		expect(ValueListUtils.maxIndex([])).toEqual(-1)
		expect(ValueListUtils.maxIndex([-Infinity])).toEqual(-1)
	})

	it('minOf', () => {
		expect(ValueListUtils.minOf([1,1,2])).toEqual(1)
		expect(ValueListUtils.minOf([])).toEqual(null)
		expect(ValueListUtils.minOf([Infinity])).toEqual(null)
	})

	it('maxOf', () => {
		expect(ValueListUtils.maxOf([1,2,2])).toEqual(2)
		expect(ValueListUtils.maxOf([])).toEqual(null)
		expect(ValueListUtils.maxOf([-Infinity])).toEqual(null)
	})

	it('binaryFindInsertIndex', () => {
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 0)).toEqual(0)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 1)).toEqual(1)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 2)).toEqual(2)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 3)).toEqual(3)
		expect(ValueListUtils.binaryFindInsertIndex([1,2,3], 4)).toEqual(3)
	})

	it('binaryFindLowerInsertIndex', () => {
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 0)).toEqual(0)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 1)).toEqual(0)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 2)).toEqual(1)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 3)).toEqual(2)
		expect(ValueListUtils.binaryFindLowerInsertIndex([1,2,3], 4)).toEqual(3)
	})

	it('binaryFind', () => {
		expect(ValueListUtils.binaryFind([1,2,3], 0)).toEqual(undefined)
		expect(ValueListUtils.binaryFind([1,2,3], 1)).toEqual(1)
		expect(ValueListUtils.binaryFind([1,2,3], 2)).toEqual(2)
		expect(ValueListUtils.binaryFind([1,2,3], 3)).toEqual(3)
		expect(ValueListUtils.binaryFind([1,2,3], 4)).toEqual(undefined)
	})

	it('binaryInsert', () => {
		expect(ValueListUtils.binaryInsert([1,2,3], 0)).toEqual(0)
		expect(ValueListUtils.binaryInsert([1,2,3], 1)).toEqual(1)
		expect(ValueListUtils.binaryInsert([1,2,3], 2)).toEqual(2)
		expect(ValueListUtils.binaryInsert([1,2,3], 3)).toEqual(3)
		expect(ValueListUtils.binaryInsert([1,2,3], 4)).toEqual(3)
	})
})
