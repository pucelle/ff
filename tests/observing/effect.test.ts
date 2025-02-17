import {trackGet, EffectMaker, untilUpdateComplete, trackSet} from '../../src'


describe('Test effect', () => {

	it('Test effect', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		let effect = new EffectMaker(() => {
			trackGet(a, 'b')
			a.b
			fn()
		})
		effect.connect()
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 2
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)

		effect.disconnect()
		a.b = 3
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)

		// Refresh after re-connected
		effect.connect()
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(3)

		// No need to refresh since no dependency has changed
		effect.disconnect()
		a.b = 3
		effect.connect()
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(3)
	})
})