import {Vector} from './vector'
import {Point} from './point'
import {MethodsObserved, GetObserved} from 'lupos'
import {LineIntersection, normalIntersect} from './helpers/line-intersect'


/** Represent a line segment. */
export class LineSegment implements MethodsObserved<
	never,
	'intersect'
> {

	/** Make line segment from start and end points. */
	static fromPoints(point1: GetObserved<Point>, point2: GetObserved<Point>) {
		return new LineSegment(point1, Vector.fromDiff(point2, point1))
	}

	
	readonly point: Point
	readonly vector: Vector

	constructor(point: GetObserved<Point>, vector: GetObserved<Vector>) {
		this.point = point
		this.vector = vector
	}

	/** 
	 * Do intersection test with another line segment,
	 * returns the intersection info.
	 */
	intersect(ls: GetObserved<LineSegment>): LineIntersection | null {
		let result = normalIntersect(this, ls)
		if (!result) {
			return null
		}

		let {miu, niu} = result
		result.intersected = miu >= 0 && miu <= 1 && niu >= 0 && niu <= 1

		return result
	}
}
