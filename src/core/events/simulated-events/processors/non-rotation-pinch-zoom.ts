import {Matrix, Point, TransformUtils} from 'math'
import {PinchZoomProcessor} from './pinch-zoom'


export interface RigidPinchZoomerEvents {

	/** When begin to pinch zoom. */
	'non-rotation-pinch-zoom:start': (e: TouchEvent) => void

	/** When fingers moved and need to update transform. */
	'non-rotation-pinch-zoom:transform': (e: TouchEvent, transformInScreenOrigin: Matrix) => void

	/** After pinch zoom compled. */
	'non-rotation-pinch-zoom:end': (e: TouchEvent) => void
}


export class NonRorationPinchZoomProcessor extends PinchZoomProcessor<RigidPinchZoomerEvents> {

	protected eventPrefix: string = 'non-rotation-pinch-zoom:'

	protected makeMatrix(point1: Point, point2: Point): Matrix {
		let matrix = TransformUtils.makeNonRotationMatrixFromPoints(
			[this.startTouchPoint1!, this.startTouchPoint2!],
			[point1, point2]
		)

		return matrix
	}
}