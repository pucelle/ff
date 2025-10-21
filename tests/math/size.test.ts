import {Size} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test Size', () => {

	it('Size Static', () => {
		expect(Size.fromLike({width: 1, height: 1})).toEqual(new Size(1, 1))
	})


	it('Size properties', () => {
		let b = new Size(10, 10)
		expect(b.area).toEqual(100)
		expect(b.empty).toEqual(false)
		expect(b.equals(new Size(10, 10))).toEqual(true)

		b.set(20, 20)
		expect(b.area).toEqual(400)

		b.copyFrom(new Size(30, 30))
		expect(b.area).toEqual(900)

		b.reset()
		expect(b.empty).toEqual(true)
	})
})