import {Matrix, Point} from '../../../math'
import {PinchTransformProcessor} from './pinch-transform'


export interface PinchZoomEvents {

	/** When begin to pinch zoom. */
	'pinch-zoom:start': (e: TouchEvent) => void

	/** When fingers moved and need to update transform. */
	'pinch-zoom:transform': (e: TouchEvent, transformInScreenOrigin: Matrix) => void

	/** After pinch zoom compled. */
	'pinch-zoom:end': (e: TouchEvent) => void
}


export class PinchZoomProcessor extends PinchTransformProcessor<PinchZoomEvents> {

	protected eventPrefix: string = 'pinch-zoom:'

	protected makeMatrix(point1: Point, point2: Point): Matrix {
		let matrix = Matrix.makeNonRotationMatrixFromPoints(
			[this.startTouchPoint1!, this.startTouchPoint2!],
			[point1, point2]
		)

		return matrix
	}
}