import * as ff from '../src'


describe('Test function', () => {
	describe('Test defer', () => {
		test('Will call fn later', async () => {
			let fn = jest.fn()
			ff.timeout(fn, 50)
			await ff.sleep(51)
			expect(fn).toBeCalledTimes(1)
		})

		test('Will not call fn after been canceled', async () => {
			let fn = jest.fn()
			let defer = ff.timeout(fn, 50)
			expect(defer.cancel()).toBeTruthy()
			await ff.sleep(51)
			expect(fn).toBeCalledTimes(0)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let timeout = ff.timeout(fn, 50)
			await ff.sleep(30)
			expect(timeout.reset()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(50)
			expect(fn).toBeCalledTimes(1)
			expect(timeout.reset()).toBeTruthy()
			await ff.sleep(50)
			expect(fn).toBeCalledTimes(2)
		})

		test('Will call fn immediately after been flush', async () => {
			let fn = jest.fn()
			let timeout = ff.timeout(fn, 50)
			expect(timeout.flush()).toBeTruthy()
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(51)
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
			let interval = willEndInterval(fn, 20)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will not call fn after been canceled', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 20)
			expect(interval.cancel()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(0)
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 20)
			await ff.sleep(10)
			expect(interval.reset()).toBeTruthy()
			await ff.sleep(11)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(1)
			expect(interval.reset()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will call fn immediately after been flush', async () => {
			let fn = jest.fn()
			let interval = willEndInterval(fn, 20)
			expect(interval.flush()).toBeTruthy()
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})
	})


	describe('Test throttle', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			expect(throttle.cancel()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(1)
			expect(throttle.reset()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(2)
			await ff.sleep(120)
			expect(fn).toBeCalledTimes(3)
			expect(interval.cancel()).toBeTruthy()
		})

		test('No thing happens when flush', async () => {
			let fn = jest.fn()
			let throttle = ff.throttle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			expect(throttle.flush()).toBeFalsy()
			expect(interval.cancel()).toBeTruthy()
		})
	})


	describe('Test smoothThrottle', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			expect(throttle.cancel()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			await ff.sleep(51)
			expect(throttle.reset()).toBeTruthy()
			await ff.sleep(70)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(100)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Can flush', async () => {
			let fn = jest.fn()
			let throttle = ff.smoothThrottle(fn, 100)
			let throttleFn = throttle.wrapped
			let interval = willEndInterval(throttleFn, 20)
			await ff.sleep(1)
			expect(throttle.flush()).toBeFalsy()
			await ff.sleep(20)
			expect(throttle.flush()).toBeTruthy()
			expect(fn).toBeCalledTimes(1)
			expect(interval.cancel()).toBeTruthy()
		})
	})


	describe('Test debounce', () => {
		test('Will call fn in expected time points', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 20)
			await ff.sleep(201)
			expect(fn).toBeCalledTimes(0)
			expect(interval.cancel()).toBeTruthy()
			await ff.sleep(120)
			expect(fn).toBeCalledTimes(1)
		})

		test('Will call fn frequently after been canceled', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 20)
			expect(debounce.cancel()).toBeTruthy()
			await ff.sleep(21)
			expect(fn).toBeCalledTimes(1)
			await ff.sleep(20)
			expect(fn).toBeCalledTimes(2)
			expect(interval.cancel()).toBeTruthy()
		})

		test('Will reset timeout after been reset', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 20)
			await ff.sleep(51)
			expect(debounce.reset()).toBeTruthy()
			await ff.sleep(20)
			expect(interval.cancel()).toBeTruthy()
			await ff.sleep(70)
			expect(fn).toBeCalledTimes(0)
			await ff.sleep(50)
			expect(fn).toBeCalledTimes(1)
		})

		test('Can flush', async () => {
			let fn = jest.fn()
			let debounce = ff.debounce(fn, 100)
			let debounceFn = debounce.wrapped
			let interval = willEndInterval(debounceFn, 20)
			await ff.sleep(1)
			expect(debounce.flush()).toBeFalsy()
			await ff.sleep(20)
			expect(debounce.flush()).toBeTruthy()
			expect(fn).toBeCalledTimes(1)
			expect(interval.cancel()).toBeTruthy()
		})
	})
})