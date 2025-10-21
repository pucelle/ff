import {range, sleep} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test range', () => {
	it('range step 1', () => {
		expect([...range(0, 2)]).toEqual([0, 1])
		expect([...range(0, 2, 1)]).toEqual([0, 1])
	})

	it('range step -1', () => {
		expect([...range(2, 0, -1)]).toEqual([2, 1])
	})

	it('range step 2', () => {
		expect([...range(0, 5, 2)]).toEqual([0, 2, 4])
	})

	it('range step 0', () => {
		expect(() => [...range(0, 1, 0)]).toThrow(RangeError)
	})

	it('sleep', async () => {
		let startTime = Date.now()
		await sleep()
		expect(Date.now() - startTime).toBeLessThan(50)

		startTime = Date.now()
		await sleep(100)
		expect(Date.now() - startTime - 100).toBeLessThan(50)
	})
})
