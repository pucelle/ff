import {barrierDOMReading, barrierDOMWriting} from '../../src'


describe('Test BarrierQueue', () => {

	it('Test order', async () => {
		let results: number[] = []
		let q1 = barrierDOMReading().then(() => results.push(1))
		let q2 = barrierDOMWriting().then(() => results.push(2))
		let q3 = barrierDOMReading().then(() => results.push(3))
		let q4 = barrierDOMWriting().then(() => results.push(4))

		await Promise.all([q1, q2, q3, q4])
		console.log(results)
		expect(results).toEqual([1, 3, 2, 4])
	})
})