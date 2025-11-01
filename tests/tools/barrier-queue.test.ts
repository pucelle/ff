import {barrierDOMReading, barrierDOMWriting} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test BarrierQueue', () => {

	it('Test order', async () => {
		let results: number[] = []
		let q1 = barrierDOMReading().then(() => results.push(1))
		let q2 = barrierDOMWriting().then(() => results.push(2))
		let q3 = barrierDOMReading().then(() => results.push(3))
		let q4 = barrierDOMWriting().then(() => results.push(4))

		await Promise.all([q1, q2, q3, q4])
		expect(results).toEqual([1, 3, 2, 4])
	})

	it('Test multiple reading should all before writing', async () => {
		let results: number[] = []

		let q1 = async () => {
			await barrierDOMWriting()
			results.push(3)
		}

		let q2 = async () => {
			await barrierDOMReading()
			results.push(1)
			await barrierDOMReading()
			results.push(2)
		}

		await Promise.all([q1(), q2()])
		expect(results).toEqual([1, 2, 3])
	})

	it('Test multiple writing should be bundled', async () => {
		let results: number[] = []

		let q1 = async () => {
			await barrierDOMWriting()
			await barrierDOMWriting()
			results.push(2)
		}

		let q2 = async () => {
			await barrierDOMWriting()
			results.push(1)
			await barrierDOMReading()
			results.push(3)
		}

		await Promise.all([q1(), q2()])
		expect(results).toEqual([1, 2, 3])
	})
})