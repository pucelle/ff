import * as ff from '../src'


describe('Test function', () => {
	test('sleep', async () => {
		let startTime = Date.now()
		await ff.sleep(100)
		expect(Math.abs(Date.now() - startTime - 100)).toBeLessThan(10)
	})
})