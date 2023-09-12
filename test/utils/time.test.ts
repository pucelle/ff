import {TimeUtils} from '../../src/utils/time'


describe('Test time', () => {
	test('sleep', async () => {
		let startTime = Date.now()
		await TimeUtils.sleep()
		expect(Date.now() - startTime).toBeLessThan(50)

		startTime = Date.now()
		await TimeUtils.sleep(100)
		expect(Date.now() - startTime - 100).toBeLessThan(50)
	})
})