import {UpdateQueue} from '../../src'


describe('Test UpdateQueue', () => {

	it('Test enqueue', async () => {
		let v = 1

		let f1 = () => {
			expect(v).toEqual(2)
		}

		let f2 = () => {
			expect(v).toEqual(1)
			v++
		}

		UpdateQueue.enqueue(f1, null, 1)
		UpdateQueue.enqueue(f2, null, 0)

		await UpdateQueue.untilComplete()
	})
})