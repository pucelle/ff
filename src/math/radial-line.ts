import {Vector} from './vector'
import {Direction} from './direction'
import {Point} from './point'
import {Box} from './box'
import {LineIntersection, LineSegment, normalIntersect} from './line-segment'
import {ListUtils} from '../utils'


/** Represent a radial line. */
export class RadialLine {

	/** Make radial line from point and direction. */
	static fromPointAndDirection(point: Point, direction: Direction) {
		return new RadialLine(point, direction.toVector())
	}

	/** Make radial line from point and angle in degree. */
	static fromPointAndDegree(point: Point, degree: number) {
		return new RadialLine(point, Vector.fromDegree(degree))
	}

	/** Make radial line from point and angle in radians. */
	static fromPointAndRadians(point: Point, radians: number) {
		return new RadialLine(point, Vector.fromRadians(radians))
	}

	/** Make radial line from start and end points. */
	static fromPoints(point1: Point, point2: Point) {
		return new RadialLine(point1, point2.diff(point1))
	}

	readonly point: Point
	readonly vector: Vector

	constructor(point: Point, vector: Vector) {
		this.point = point
		this.vector = vector
	}

	/** Do intersection test with a line segment. */
	interactWithLineSegment(ls: LineSegment): LineIntersection | null {
		let result = normalIntersect(this, ls)
		if (!result) {
			return null
		}

		let {miu, niu} = result
		result.intersected = miu >= 0 && niu >= 0 && niu <= 1

		return result
	}

	/** Do intersection test with another radial line . */
	intersect(radialLine: RadialLine): LineIntersection | null {
		let result = normalIntersect(this, radialLine)
		if (!result) {
			return null
		}

		let {miu, niu} = result
		result.intersected = miu >= 0 && niu >= 0

		return result
	}
	
	/** Get the closest intersection point with all edges of a box. */
	getClosestIntersectPointWithBox(box: Box): Point | null {

		// Do 4 box edge distances intersection test.
		let intersects = box.edges().map(ls => this.interactWithLineSegment(ls))
			.filter(i => i !== null && i.intersected) as LineIntersection[]

		// Choose the intersection having the minimum `miu`.
		let best = ListUtils.minOf(intersects, i => i.miu)

		return best?.point || null
	}

	/** 
	 * Get the closest intersection point with all edges of a box.
	 * If is not intersected, extend the box edge to lines and do again.
	 * If is still not intersected, extend the radial line to it's back side.
	 */
	getExtendedClosestIntersectPointWithBox(box: Box): Point {

		// Box must not empty.
		if (box.empty) {
			box.expandSelf(1)
		}

		// Do 4 box edge distances intersection test.
		let intersects = box.edges().map(ls => this.interactWithLineSegment(ls))
			.filter(i => i !== null) as LineIntersection[]

		// Intersected ones.
		let candidate = intersects.filter(i => i.intersected)

		// Front of the radial line.
		if (candidate.length === 0) {
			candidate = intersects.filter(i => i.miu >= 0)
		}

		// Back of the radial line.
		if (candidate.length === 0) {
			candidate = intersects
		}

		// Choose the positive minimum μ, it's the first intersected point in the positive direction.
		let best = ListUtils.minOf(candidate, i => Math.abs(i.miu))!

		return best.point
	}
}