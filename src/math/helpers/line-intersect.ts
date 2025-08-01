import {Matrix} from '../matrix'
import {Point} from '../point'
import {Vector} from '../vector'


/** A point and some parameters to represent how one radial line intersect with another. */
export interface LineIntersection {

	/** The intersect point. */
	point: Point

	/** 
	 * The line vector factor,
	 * it represent the ratio that the `intersection point - line origin / line vector`.
	 */
	miu: number

	/** 
	 * Another line vector factor,
	 * it represent the ratio that the `intersection point - another line origin / another line vector`.
	 */
	niu: number

	/** Whether intersected. */
	intersected: boolean
}

/** 
 * Do intersection test with line segments or radial lines.
 * It expands line segments or radial lines and do intersection test.
 */
export function normalIntersect(pv1: {point: Point, vector: Vector}, pv2: {point: Point, vector: Vector}): LineIntersection | null {
	let a = pv1.point
	let b = pv1.vector
	let c = pv2.point
	let d = pv2.vector

	let m = Matrix.fromCoords(b, d)

	// Two vectors are parallel with each other.
	if (m.getDeterminant() === 0) {
		let diff = Vector.fromDiff(c, a)

		// In the same line.
		if (diff.cross(b) !== 0) {
			return null
		}

		// Using `point1` and `vector1` represents `point2` and `point2 + vector2`, get vector factors.
		let start = diff.dot(b) / b.getLengthSquare()

		// Equals `point2 + vector2 - point1`
		let endDiff = diff.add(d)
		let end = endDiff.dot(b) / b.getLengthSquare()

		let niu: number

		if (Math.max(start, end) < 0) {
			niu = Math.max(start, end) / 2
		}
		else if (Math.min(start, end) > 1) {
			niu = Math.min(start, end) / 2
		}
		else {
			niu = (Math.max(start, end, 0) + Math.min(start, end, 1)) / 2
		}

		let point = c.addSelf(d.multiplyScalarSelf(niu))
		let miu = Vector.fromDiff(point, a).dot(b) / b.getLengthSquare()

		return {
			point,
			miu,
			niu,
			intersected: true,
		}
	}

	// a + bμ = c + dν
	// => bμ - dν = c - a
	//  = [b, d][μ, -v]^T = [c - a]^T
	// => [μ, -v]^T = [b, d]^-1 * [c - a]^T

	let mn = m.inverse().transformVector(Vector.fromDiff(c, a))
	let miu = mn.x
	let niu = -mn.y
	let point = a.add(b.multiplyScalar(miu))

	return {
		point,
		miu,
		niu,
		intersected: false,
	}
}