import {LazyGetter} from '../../src'
import {describe, expect, it, vi} from 'vitest'


describe('LazyGetter', () => {
	it('caches falsy values until reset', () => {
		let getter = vi.fn(() => 0)
		let lazy = new LazyGetter(getter)

		expect(lazy.value).toEqual(0)
		expect(lazy.value).toEqual(0)
		expect(getter).toHaveBeenCalledOnce()

		lazy.reset()
		expect(lazy.value).toEqual(0)
		expect(getter).toHaveBeenCalledTimes(2)
	})

	it('does not initialize an unused value when resetting with cleanup', () => {
		let getter = vi.fn(() => ({value: 1}))
		let dispose = vi.fn()
		let lazy = new LazyGetter(getter)

		lazy.reset(dispose)
		expect(getter).not.toHaveBeenCalled()
		expect(dispose).not.toHaveBeenCalled()
		expect(lazy.value).toEqual({value: 1})
		expect(getter).toHaveBeenCalledOnce()
	})

	it('cleans up an initialized falsy value only once and creates it again on demand', () => {
		let getter = vi.fn(() => 0)
		let dispose = vi.fn()
		let lazy = new LazyGetter(getter)

		expect(lazy.value).toBe(0)
		lazy.reset(dispose)
		lazy.reset(dispose)
		expect(dispose).toHaveBeenCalledExactlyOnceWith(0)
		expect(getter).toHaveBeenCalledOnce()
		expect(lazy.value).toBe(0)
		expect(getter).toHaveBeenCalledTimes(2)
	})

})
