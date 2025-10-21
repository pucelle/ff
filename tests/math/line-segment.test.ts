import {Point, LineSegment} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test LineSegment', () => {

	it('LineSegment', () => {
		let s1 = LineSegment.fromPoints(new Point(0, 0), new Point(1, 0))
		let s2 = LineSegment.fromPoints(new Point(0, 0), new Point(1, 0))
		let s3 = LineSegment.fromPoints(new Point(10, 0), new Point(11, 0))
		let s4 = LineSegment.fromPoints(new Point(0, 0), new Point(0, 1))
		let s5 = LineSegment.fromPoints(new Point(0.5, -0.5), new Point(0.5, 0.5))

		expect(s1.intersect(s2)).toEqual({intersected: true, miu: 0.5, niu: 0.5, point: {x: 0.5, y: 0}})
		expect(s1.intersect(s3)).toEqual({intersected: false, miu: 15, niu: 5, point: {x: 15, y: 0}})
		expect(s1.intersect(s4)).toEqual({point: new Point(0, 0), miu: 0, niu: -0, intersected: true})
		expect(s1.intersect(s5)).toEqual({point: new Point(0.5, 0), miu: 0.5, niu: 0.5, intersected: true})
	})
})