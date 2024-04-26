import {Debounce, Interval, Throttle, timeout, Timeout} from '../../src/utils/time-control'
import {sleep} from '../../src/utils/function'


describe('Test time-control', () => {
	describe('Test timeout', () => {
		test('Will call fn', async () => {
			let fn = jest.fn()
			timeout(fn)
			await sleep(1)
			expect(fn).toHaveBeenCalledTimes(1)
		})

		test('Will call fn later', async () => {
			let fn = jest.fn()
			timeout(fn, 40)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
		})

		test('Will not call fn after been canceled', async () => {
			let fn = jest.fn()
			let cancel = timeout(fn, 40)
			cancel()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(0)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let timeout = new Timeout(fn, 40)
			await sleep(20)
			timeout.start()
			await sleep(21)
			expect(fn).toHaveBeenCalledTimes(0)
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(1)
			timeout.start()
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(2)
		})

		test('Will call fn immediately after been flush', async () => {
			let fn = jest.fn()
			let timeout = new Timeout(fn, 40)
			timeout.flush()
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			timeout.flush()
			expect(fn).toHaveBeenCalledTimes(2)
		})
	})


	let willAlwaysEndInterval = (fn: Function, ms: number) => {
		let interval = new Interval(fn, ms)
		let timeout = new Timeout(interval.cancel, 3000)

		let oldCancel = interval.cancel
		interval.cancel = () => {
			timeout.cancel()
			return oldCancel.call(interval)
		}

		interval.start()

		return interval
	}


	describe('Test interval', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let interval = willAlwaysEndInterval(fn, 40)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will not call fn after been canceled', async () => {
			let fn = jest.fn()
			let interval = willAlwaysEndInterval(fn, 40)
			interval.cancel()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(0)
		})

		test('Will reset interval time after been reset', async () => {
			let fn = jest.fn()
			let interval = willAlwaysEndInterval(fn, 40)
			await sleep(20)
			interval.start()
			await sleep(21)
			expect(fn).toHaveBeenCalledTimes(0)
			await sleep(20)
			expect(fn).toHaveBeenCalledTimes(1)
			interval.start()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will call fn immediately after been flush', async () => {
			let fn = jest.fn()
			let interval = willAlwaysEndInterval(fn, 40)
			interval.flush()
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})
	})


	describe('Test immediate throttle', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100, true)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(100)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100, true)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			throttle.cancel()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100, true)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			throttle.reset()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(2)
			await sleep(140)
			expect(fn).toHaveBeenCalledTimes(3)
			interval.cancel()
		})
	})


	describe('Test not immediate throttle', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(0)
			await sleep(100)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(100 + 40)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			throttle.cancel()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			await sleep((100 + 40) / 2 + 1)
			throttle.reset()
			await sleep((100 + 40) / 2 + 1)
			expect(fn).toHaveBeenCalledTimes(0)
			await sleep(100)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(100)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Can flush', async () => {
			let fn = jest.fn()
			let throttle = new Throttle(fn, 100)
			let throttled = throttle.wrapped
			let interval = willAlwaysEndInterval(throttled, 40)
			throttle.flush()
			await sleep(41)
			throttle.flush()
			expect(fn).toHaveBeenCalledTimes(1)
			interval.cancel()
		})
	})


	describe('Test debounce', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let debounce = new Debounce(fn, 100)
			let debounced = debounce.wrapped
			let interval = willAlwaysEndInterval(debounced, 40)
			await sleep(201)
			expect(fn).toHaveBeenCalledTimes(0)
			interval.cancel()
			await sleep(100 + 40)
			expect(fn).toHaveBeenCalledTimes(1)
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let debounce = new Debounce(fn, 100)
			let debounced = debounce.wrapped
			let interval = willAlwaysEndInterval(debounced, 40)
			debounce.cancel()
			await sleep(41)
			expect(fn).toHaveBeenCalledTimes(1)
			await sleep(40)
			expect(fn).toHaveBeenCalledTimes(2)
			interval.cancel()
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let debounce = new Debounce(fn, 100)
			let debounced = debounce.wrapped
			let interval = willAlwaysEndInterval(debounced, 40)
			await sleep((100 + 40) / 2 + 1)
			debounce.reset()
			await sleep((100 + 40) / 2 + 1)
			expect(fn).toHaveBeenCalledTimes(0)

			debounce.reset()
			await sleep(41)
			interval.cancel()
			await sleep(100)
			expect(fn).toHaveBeenCalledTimes(1)
		})

		test('Can flush', async () => {
			let fn = jest.fn()
			let debounce = new Debounce(fn, 100)
			let debounced = debounce.wrapped
			let interval = willAlwaysEndInterval(debounced, 40)
			await sleep(1)
			debounce.flush()
			await sleep(40)
			debounce.flush()
			expect(fn).toHaveBeenCalledTimes(1)
			interval.cancel()
		})
	})
})