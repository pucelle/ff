import * as ff from '../../src'


describe('Test function', () => {
	test('sleep', async () => {
		let startTime = Date.now()
		await ff.sleep()
		expect(Date.now() - startTime).toBeLessThan(20)

		startTime = Date.now()
		await ff.sleep(100)
		expect(Date.now() - startTime - 100).toBeLessThan(20)
	})
})