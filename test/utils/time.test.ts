import {sleep} from '../../src/utils/function'


describe('Test time', () => {
	test('sleep', async () => {
		let startTime = Date.now()
		await sleep()
		expect(Date.now() - startTime).toBeLessThan(50)

		startTime = Date.now()
		await sleep(100)
		expect(Date.now() - startTime - 100).toBeLessThan(50)
	})
})