import {LineSegment} from '../../src/math/line-segment'
import {Direction} from '../../src/math/direction'
import {Point} from '../../src/math/point'
import {RadialLine} from '../../src/math/radial-line'
import {Vector} from '../../src/math/vector'
import {Box} from '../../src/math/box'
import {NumberUtils} from '../../src/utils'


describe('Test RadialLine', () => {

	test('RadialLine Static', () => {
		expect(RadialLine.fromPointAndDirection(new Point(0, 0), Direction.Right)).toEqual(new RadialLine(new Point(0, 0), new Vector(1, 0)))

		let l = RadialLine.fromPointAndDegree(new Point(0, 0), 90)
		l.vector.x = NumberUtils.toDecimal(l.vector.x, 8)
		expect(l).toEqual(new RadialLine(new Point(0, 0), new Vector(0, 1)))

		l = RadialLine.fromPointAndRadians(new Point(0, 0), Math.PI / 2)
		l.vector.x = NumberUtils.toDecimal(l.vector.x, 8)
		expect(l).toEqual(new RadialLine(new Point(0, 0), new Vector(0, 1)))

		expect(RadialLine.fromPoints(new Point(0, 0), new Point(0, 1))).toEqual(new RadialLine(new Point(0, 0), new Vector(0, 1)))
	})


	test('interactWithLineSegment', () => {
		let l = new RadialLine(new Point(0, 0), new Vector(1, 0))

		let s = new LineSegment(new Point(0, 0), new Vector(1, 0))
		expect(l.interactWithLineSegment(s)).toEqual({point: new Point(0.5, 0), miu: 0.5, niu: 0.5, intersected: true})

		s = new LineSegment(new Point(0, 0), new Vector(0, 1))
		expect(l.interactWithLineSegment(s)).toEqual({point: new Point(0, 0), miu: 0, niu: -0, intersected: true})

		s = new LineSegment(new Point(0.5, 0.5), new Vector(0, 1))
		expect(l.interactWithLineSegment(s)).toEqual({point: new Point(0.5, 0), miu: 0.5, niu: -0.5, intersected: false})
	})


	test('intersect', () => {
		let l = new RadialLine(new Point(0, 0), new Vector(1, 0))

		let l2 = new RadialLine(new Point(0, 0), new Vector(1, 0))
		expect(l.intersect(l2)).toEqual({point: new Point(0.5, 0), miu: 0.5, niu: 0.5, intersected: true})

		l2 = new RadialLine(new Point(0, 0), new Vector(0, 1))
		expect(l.intersect(l2)).toEqual({point: new Point(0, 0), miu: 0, niu: -0, intersected: true})

		l2 = new RadialLine(new Point(0.5, 0.5), new Vector(0, 1))
		expect(l.intersect(l2)).toEqual({point: new Point(0.5, 0), miu: 0.5, niu:-0.5, intersected: false})
	})

	test('getClosestIntersectPointWithBox', () => {
		let l = new RadialLine(new Point(0, 0), new Vector(1, 0))

		let b = new Box(0, 0, 10, 10)
		expect(l.getClosestIntersectPointWithBox(b)).toEqual(new Point(0, 0))

		b = new Box(1, -1, 10, 10)
		expect(l.getClosestIntersectPointWithBox(b)).toEqual(new Point(1, 0))

		b = new Box(10, 10, 10, 10)
		expect(l.getClosestIntersectPointWithBox(b)).toEqual(null)
	})

	test('getExtendedClosestIntersectPointWithBox', () => {
		let l = new RadialLine(new Point(0, 0), new Vector(1, 0))

		let b = new Box(0, 0, 10, 10)
		expect(l.getExtendedClosestIntersectPointWithBox(b)).toEqual(new Point(0, 0))

		b = new Box(1, -1, 10, 10)
		expect(l.getExtendedClosestIntersectPointWithBox(b)).toEqual(new Point(1, 0))

		b = new Box(10, 10, 10, 10)
		expect(l.getExtendedClosestIntersectPointWithBox(b)).toEqual(new Point(10, 0))
	})
})