import * as ff from '../..'


describe('Test function', () => {
	describe('Test timeout', () => {
		test('Will call fn', async () => {
			let fn = jest.fn()
			ff.timeout(fn)
			await ff.sleep(1)
			expect(fn).toBeCalledTimes(1)
		})

		test('Will call fn later', async () => {
			let fn = jest.fn()
			ff.timeout(fn, 40)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
		})

		test('Will not call fn after been canceled', async () => {
			let fn = jest.fn()
			let timeout = ff.timeout(fn, 40)
			expect(timeout.cancel()).toEqual(true)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(0)
			expect(timeout.cancel()).toEqual(false)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let timeout = ff.timeout(fn, 40)
			await ff.sleep(20)
			expect(timeout.reset()).toEqual(true)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(1)
			expect(timeout.reset()).toEqual(true)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(2)
		})

		test('Will call fn immediately after been flush', async () => {
			let fn = jest.fn()
			let timeout = ff.timeout(fn, 40)
			expect(timeout.flush()).toEqual(true)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			expect(timeout.flush()).toEqual(false)
			expect(fn).toBeCalledTimes(1)
		})
	})


	let willEndInterval = (fn: Function, ms: number) => {
		let interval = ff.interval(fn, ms)
		let timeout = ff.timeout(interval.cancel, 3000)

		let oldCancel = interval.cancel
		interval.cancel = () => {
			timeout.cancel()
			return oldCancel.call(interval)
		}
		return interval
	}


	describe('Test interval', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 40)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will not call fn after been canceled', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 40)
			expect(interval.cancel()).toEqual(true)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(0)
			expect(interval.cancel()).toEqual(false)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 40)
			await ff.sleep(20)
			expect(interval.reset()).toEqual(true)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(1)
			expect(interval.reset()).toEqual(true)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will call fn immediately after been flush', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 40)
			expect(interval.flush()).toEqual(true)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
			expect(interval.flush()).toEqual(false)
		})
	})


	describe('Test throttle', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			expect(throttle.cancel()).toEqual(true)
			expect(throttle.cancel()).toEqual(false)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			expect(throttle.reset()).toEqual(true)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(2)
			await ff.sleep(140)
			expect(fn).toBeCalledTimes(3)
			expect(interval.cancel()).toEqual(true)
		})

		test('No thing happens when flush', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			expect(throttle.flush()).toEqual(true)
			expect(interval.cancel()).toEqual(true)
		})
	})


	describe('Test smoothThrottle', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			expect(throttle.cancel()).toEqual(true)
			expect(throttle.cancel()).toEqual(false)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			await ff.sleep((100 + 40) / 2 + 1)
			expect(throttle.reset()).toEqual(true)
			await ff.sleep((100 + 40) / 2 + 1)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Can flush', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 40)
			expect(throttle.flush()).toEqual(false)
			await ff.sleep(41)
			expect(throttle.flush()).toEqual(true)
			expect(fn).toBeCalledTimes(1)
			expect(interval.cancel()).toEqual(true)
		})
	})


	describe('Test debounce', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 40)
			await ff.sleep(201)
			expect(fn).toBeCalledTimes(0)
			expect(interval.cancel()).toEqual(true)
			await ff.sleep(100 + 40)
			expect(fn).toBeCalledTimes(1)
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 40)
			expect(debounce.cancel()).toEqual(true)
			expect(debounce.cancel()).toEqual(false)
			await ff.sleep(41)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(40)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toEqual(true)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 40)
			await ff.sleep((100 + 40) / 2 + 1)
			expect(debounce.reset()).toEqual(true)
			await ff.sleep((100 + 40) / 2 + 1)
			expect(fn).toBeCalledTimes(0)

			expect(debounce.reset()).toEqual(true)
			await ff.sleep(41)
			expect(interval.cancel()).toEqual(true)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(1)
		})

		test('Can flush', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 40)
			await ff.sleep(1)
			expect(debounce.flush()).toEqual(false)
			await ff.sleep(40)
			expect(debounce.flush()).toEqual(true)
			expect(fn).toBeCalledTimes(1)
			expect(interval.cancel()).toEqual(true)
		})
	})
})