import {trackGet, trackSet, untilUpdateComplete, WatchMaker, WatchMultiMaker} from '../../src'


describe('Test watch', () => {

	it('Test watch', async () => {
		let a = {b: 1}
		let fn = jest.fn()
		let callback = jest.fn()

		let watch = new WatchMaker(() => {
			trackGet(a, 'b')
			fn()
			return a.b
		}, callback)
		watch.connect()
		await untilUpdateComplete()
		
		a.b = 2
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)
		expect(callback).toHaveBeenCalledTimes(1)

		watch.disconnect()
		a.b = 3
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)
		expect(callback).toHaveBeenCalledTimes(1)

		// Refresh after re-connected
		watch.connect()
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(3)
		expect(callback).toHaveBeenCalledTimes(2)

		// No need to refresh since no dependency has changed
		watch.disconnect()
		a.b = 3
		watch.connect()
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(4)
		expect(callback).toHaveBeenCalledTimes(2)
	})


	it('Test watch immediately', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		let watch = new WatchMaker(() => {
			trackGet(a, 'b')
			return a.b
		}, fn, null, {immediate: true})
		watch.connect()
		
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 2
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)
	})


	it('Test watch once', async () => {
		let a = {b: 1}
		let fn = jest.fn()

		let watch = new WatchMaker(() => {
			trackGet(a, 'b')
			return a.b
		}, fn, null, {once: true})

		watch.connect()
		await untilUpdateComplete()

		a.b = 2
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)

		a.b = 3
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})


	it('Test watch until', async () => {
		let a = {b: 0}
		let fn = jest.fn()

		let watch = new WatchMaker(() => {
			trackGet(a, 'b')
			return a.b
		}, fn, null, {untilTrue: true})
		watch.connect()

		a.b = 0
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(0)

		a.b = 1
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)
	})

	it('Test watch multiple', async () => {
		let a = {b: 0, c: 0}
		let fn = jest.fn()

		let watch = new WatchMultiMaker([
			() => {
				trackGet(a, 'b')
				return a.b
			},
			() => {
				trackGet(a, 'c')
				return a.c
			}
		], fn, null)
		watch.connect()

		a.b = 0
		a.c = 0
		trackSet(a, 'b', 'c')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(0)

		a.b = 1
		trackSet(a, 'b')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(1)

		a.c = 1
		trackSet(a, 'c')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(2)

		a.b = 2
		a.c = 2
		trackSet(a, 'b', 'c')
		await untilUpdateComplete()
		expect(fn).toHaveBeenCalledTimes(3)
	})
})