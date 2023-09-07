import {Matrix, Point, TransformUtils} from 'math'
import {DOMEvents} from '../../dom-events'
import {EventFirer} from '../../event-firer'


export interface PinchZoomerEvents {

	/** When begin to pinch zoom. */
	'pinch-zoom:start': (e: TouchEvent) => void

	/** When fingers moved and need to update transform. */
	'pinch-zoom:transform': (e: TouchEvent, transformInScreenOrigin: Matrix) => void

	/** After pinch zoom compled. */
	'pinch-zoom:end': (e: TouchEvent) => void
}


export class PinchZoomProcessor<E = PinchZoomerEvents> extends EventFirer<E> {

	protected el: EventTarget
	protected startTouchPoint1: Point | null = null
	protected startTouchPoint2: Point | null = null
	protected eventPrefix: string = 'pinch-zoom:'

	constructor(el: EventTarget) {
		super()

		this.el = el
		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this)
	}

	protected get inTouching(): boolean {
		return !!this.startTouchPoint1
	}

	protected onTouchStart(e: TouchEvent) {
		this.fire(this.eventPrefix + 'start' as any, ...[e] as any)

		DOMEvents.on(document, 'touchmove', this.onTouchMove as any, this)
		DOMEvents.on(document, 'touchend', this.onTouchEnd as any, this)
	}

	protected onTouchMove(e: TouchEvent) {
		if (e.touches.length !== 2) {
			return
		}

		// May not have two points when touch start.
		if (!this.startTouchPoint1) {
			this.startTouchPoint1 = new Point(e.touches[0].clientX, e.touches[0].clientY)
			this.startTouchPoint2 = new Point(e.touches[1].clientX, e.touches[1].clientY)
		}

		let touchPoint1 = new Point(e.touches[0].clientX, e.touches[0].clientY)
		let touchPoint2 = new Point(e.touches[1].clientX, e.touches[1].clientY)
		let matrix = this.makeMatrix(touchPoint1, touchPoint2)

		this.fire(this.eventPrefix + 'transform' as any, ...[e, matrix] as any)
	}

	protected makeMatrix(point1: Point, point2: Point): Matrix {
		let matrix = TransformUtils.makeNonSkewMatrixFromPoints(
			[this.startTouchPoint1!, this.startTouchPoint2!],
			[point1, point2]
		)

		return matrix
	}

	protected onTouchEnd(e: TouchEvent) {
		this.endTouching()
		this.fire(this.eventPrefix + 'end' as any, ...[e] as any)
	}

	protected endTouching() {
		this.startTouchPoint1 = null
		this.startTouchPoint2 = null

		DOMEvents.off(document, 'touchmove', this.onTouchMove as any, this)
		DOMEvents.off(document, 'touchend', this.onTouchEnd as any, this)
	}

	remove() {
		if (this.inTouching) {
			this.endTouching()
		}

		DOMEvents.off(this.el, 'touchstart', this.onTouchStart as any, this)
	}
}