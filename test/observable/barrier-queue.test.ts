import {BarrierQueue} from '../../src/observable/barrier-queue'


describe('Test BarrierQueue', () => {

	it('Test order', async () => {
		let q = new BarrierQueue()
		let v = 0

		async function f1() {
			v += 1
			await q.barrier(0)
			expect(v).toEqual(2)
		}

		async function f2() {
			v += 1
			await q.barrier(0)
			expect(v).toEqual(2)
		}

		await Promise.all([
			f1(),
			f2(),
		])
	})
})