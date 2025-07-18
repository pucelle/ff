import {Vector} from './vector'
import {Point} from './point'
import {MethodsToObserve, ToObserve} from '@pucelle/lupos'
import {LineIntersection, normalIntersect} from './helpers/line-intersect'


/** Represent a line segment. */
export class LineSegment implements MethodsToObserve<
	never,
	'intersect'
> {

	/** Make line segment from start and end points. */
	static fromPoints(point1: ToObserve<Point>, point2: ToObserve<Point>) {
		return new LineSegment(point1, Vector.fromDiff(point2, point1))
	}

	
	readonly point: Point
	readonly vector: Vector

	constructor(point: ToObserve<Point>, vector: ToObserve<Vector>) {
		this.point = point
		this.vector = vector
	}

	/** 
	 * Do intersection test with another line segment,
	 * returns the intersection info.
	 */
	intersect(ls: ToObserve<LineSegment>): LineIntersection | null {
		let result = normalIntersect(this, ls)
		if (!result) {
			return null
		}

		let {miu, niu} = result
		result.intersected = miu >= 0 && miu <= 1 && niu >= 0 && niu <= 1

		return result
	}
}
