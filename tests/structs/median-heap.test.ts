import {MedianHeap} from '../../src'
import {describe, it, expect} from 'vitest'


function expectMedianHeap(m: MedianHeap<number>) {
	let sortedList = m.list.toSorted((a, b) => a - b)
	return expect(m.median).toEqual(sortedList[Math.floor((sortedList.length - 1) / 2)])
}


describe('Test MedianHeap', () => {
	
	it('MedianHeap', () => {
		let m = new MedianHeap<number>((a, b) => a - b)
		
		for (let i = 0; i < 100; i++) {
			m.add(Math.round(Math.random() * 100))
		}

		expectMedianHeap(m)
	})
})