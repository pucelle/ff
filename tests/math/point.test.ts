import {Point, Vector, NumberUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test Point', () => {

	it('Point Static', () => {
		expect(Point.from({x: 1, y: 1})).toEqual(new Point(1, 1))

		let p = Point.fromDegree(90)
		p.x = NumberUtils.toDecimal(p.x, 8)
		expect(p).toEqual(new Point(0, 1))

		p = Point.fromRadians(Math.PI / 2)
		p.x = NumberUtils.toDecimal(p.x, 8)
		expect(p).toEqual(new Point(0, 1))
	})


	it('Point', () => {
		let p = new Point()

		p.set(1, 1)
		expect(p).toEqual(new Point(1, 1))

		p.reset()
		expect(p).toEqual(new Point(0, 0))

		p.copyFrom(new Point(1, 1))
		expect(p).toEqual(new Point(1, 1))

		p.set(1, 1)
		expect(p.clone()).toEqual(new Point(1, 1))

		p.set(1, 1)
		expect(p.equals(new Point(1, 1))).toEqual(true)

		p.set(1, 1)
		expect(p.isZero()).toEqual(false)

		p.set(0, 0)
		expect(p.isZero()).toEqual(true)

		p.set(1, 1)
		expect(p.add(new Vector(1, 1))).toEqual(new Point(2, 2))

		p.set(1, 1)
		expect(p.sub(new Vector(1, 1))).toEqual(new Point(0, 0))

		p.set(1, 1)
		expect(p.translate(1, 1)).toEqual(new Point(2, 2))

		p.set(1, 1)
		expect(p.mix(new Point(2, 2), 0.5)).toEqual(new Point(1.5, 1.5))

		p.set(1, 1)
		expect(p.distanceTo(new Point(2, 2))).toEqual(Math.sqrt(2))

		p.set(1, 1)
		expect(p.toJSON()).toEqual({x: 1, y: 1})
	})
})