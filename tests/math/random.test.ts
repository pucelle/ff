import {RandomUtils} from '../../src'
import {afterEach, describe, expect, it, vi} from 'vitest'


describe('RandomUtils', () => {
	afterEach(() => vi.restoreAllMocks())

	it('randomFloat preserves the fractional random value', () => {
		vi.spyOn(Math, 'random').mockReturnValue(0.25)
		expect(RandomUtils.randomFloat(10, 20)).toEqual(12.5)
	})

	it('randomInt includes both endpoints', () => {
		vi.spyOn(Math, 'random').mockReturnValueOnce(0).mockReturnValueOnce(0.999999)
		expect(RandomUtils.randomInt(10, 20)).toEqual(10)
		expect(RandomUtils.randomInt(10, 20)).toEqual(20)
	})
})
