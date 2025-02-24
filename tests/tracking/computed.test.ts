import {ComputedMaker, trackGet, trackSet, untilUpdateComplete} from '../../src'


describe('Test computed', () => {

	it('Test computed', async () => {
		class A {
			v!: number
		}

		let a = new A()
		let fn1 = jest.fn()

		let v1 = new ComputedMaker(() => {
			trackGet(a, 'v')
			fn1()
			return a.v + 1
		})

		a.v = 1
		trackSet(a, 'v')
		await untilUpdateComplete()
		expect(v1.get()).toEqual(2)
		expect(fn1).toBeCalledTimes(1)

		a.v = 2
		trackSet(a, 'v')
		await untilUpdateComplete()
		expect(v1.get()).toEqual(3)
		expect(fn1).toBeCalledTimes(2)

		// Refresh after re-connected
		v1.disconnect()
		a.v = 3
		trackSet(a, 'v')
		v1.connect()
		await untilUpdateComplete()
		expect(v1.get()).toEqual(4)
		expect(fn1).toBeCalledTimes(3)

		// No need to refresh since no dependency has changed
		v1.disconnect()
		a.v = 3
		trackSet(a, 'v')
		v1.connect()
		await untilUpdateComplete()
		expect(v1.get()).toEqual(4)
		expect(fn1).toBeCalledTimes(3)
	})
})