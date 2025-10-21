import {AsyncTaskQueue, sleep} from '../../src'
import {describe, expect, vi, it} from 'vitest'


describe('Test AsyncTaskQueue', () => {
	
	it('AsyncTaskQueue', async () => {
		let q = new AsyncTaskQueue()
		let f1 = vi.fn()
		let f2 = vi.fn()

		q.enqueue(async () => {
			await sleep(10)
			f1()
		})

		q.enqueue(async () => {
			await sleep(10)
			f2()
		})

		await sleep(15)
		expect(f1).toHaveBeenCalledTimes(1)
		expect(f2).toHaveBeenCalledTimes(0)
		await sleep(15)
		expect(f2).toHaveBeenCalledTimes(1)
	})
})