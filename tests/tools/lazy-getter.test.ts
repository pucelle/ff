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
})
