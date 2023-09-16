import {AsyncTaskQueue} from '../../src/structs/async-task-queue'
import {TimeUtils} from '../../src/utils'


describe('Test AsyncTaskQueue', () => {
	
	test('AsyncTaskQueue', async () => {
		let q = new AsyncTaskQueue()
		let f1 = jest.fn()
		let f2 = jest.fn()

		q.enqueue(async () => {
			await TimeUtils.sleep(10)
			f1()
		})

		q.enqueue(async () => {
			await TimeUtils.sleep(10)
			f2()
		})

		await TimeUtils.sleep(11)
		expect(f1).toBeCalledTimes(1)
		expect(f2).toBeCalledTimes(0)
		await TimeUtils.sleep(10)
		expect(f2).toBeCalledTimes(1)
	})
})