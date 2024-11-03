import {enqueueUpdate, untilUpdateComplete} from '../../src'


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

		enqueueUpdate(f1, null, 1)
		enqueueUpdate(f2, null, 0)

		await untilUpdateComplete()
	})
})