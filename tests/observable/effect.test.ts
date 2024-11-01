import {trackGet, createEffect, untilUpdateComplete, trackSet} from '../../src'


describe('Test effect', () => {

	it('Test effect', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		createEffect(() => {
			trackGet(a, 'b')
			a.b
			fn()
		})
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 2
		trackSet(a, 'b')

		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)
	})
})