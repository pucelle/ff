import {PinchTransformProcessor} from './pinch-transform'


export interface PinchZoomEvents {

	/** When begin to pinch zoom. */
	'pinch-zoom:start': (e: TouchEvent) => void

	/** When fingers moved and need to update transform. */
	'pinch-zoom:transform': (e: TouchEvent, transformOnScreenOrigin: DOMMatrix) => void

	/** After pinch zoom completed. */
	'pinch-zoom:end': (e: TouchEvent) => void
}


export class PinchZoomProcessor extends PinchTransformProcessor<PinchZoomEvents> {

	protected override eventPrefix: string = 'pinch-zoom:'

	protected override makeMatrix(point1: DOMPoint, point2: DOMPoint): DOMMatrix {
		let matrix = makeNonRotationMatrixFromPoints(
			[this.startTouchPoint1!, this.startTouchPoint2!],
			[point1, point2]
		)

		return matrix
	}
}


/** 
 * Make a transform matrix which will transform from two start points, to two final points.
 * Ignore rotation part.
 * See comments in `Matrix`.
 */
export function makeNonRotationMatrixFromPoints(fromPoints: [DOMPoint, DOMPoint], toPoints: [DOMPoint, DOMPoint]): DOMMatrix {
	let c1 = fromPoints[0]
	let c2 = fromPoints[1]
	let c3 = toPoints[0]
	let c4 = toPoints[1]
	let c5 = new DOMPoint((c1.x + c2.x) * 0.5, (c1.y + c2.y) * 0.5)
	let c6 = new DOMPoint((c3.x + c4.x) * 0.5, (c3.y + c4.y) * 0.5)
	let v1 = new DOMPoint(c2.x - c1.x, c2.y - c1.y)
	let v2 = new DOMPoint(c4.x - c3.x, c4.y - c3.y)
	let a = Math.sqrt(v2.x ** 2 + v2.y ** 2) / Math.sqrt(v1.x ** 2 + v1.y ** 2)
	let b = 0
	let c = 0
	let d = a
	let e = c6.x - a * c5.x
	let f = c6.y - a * c5.y

	return new DOMMatrix([a, b, c, d, e, f])
}