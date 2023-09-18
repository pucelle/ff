import {Size} from '../../src/math/size'


describe('Test Size', () => {

	test('Size Static', () => {
		expect(Size.Zero).toEqual(new Size(0, 0))
		expect(Size.fromLike({width: 1, height: 1})).toEqual(new Size(1, 1))
	})


	test('Size properties', () => {
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