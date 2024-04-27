import {range, sleep} from '../../src/utils/function'


describe('Test range', () => {
	test('range step 1', () => {
		expect([...range(0, 2)]).toEqual([0, 1])
		expect([...range(0, 2, 1)]).toEqual([0, 1])
	})

	test('range step -1', () => {
		expect([...range(2, 0, -1)]).toEqual([2, 1])
	})

	test('range step 2', () => {
		expect([...range(0, 5, 2)]).toEqual([0, 2, 4])
	})

	test('range step 0', () => {
		expect(() => [...range(0, 1, 0)]).toThrow(RangeError)
	})

	test('sleep', async () => {
		let startTime = Date.now()
		await sleep()
		expect(Date.now() - startTime).toBeLessThan(50)

		startTime = Date.now()
		await sleep(100)
		expect(Date.now() - startTime - 100).toBeLessThan(50)
	})
})
