import * as DOMEvents from '../../dom-events'
import {EventFirer} from '../../event-firer'


export interface PinchTransformEvents {

	/** When begin to pinch transform. */
	'pinch-transform:start': (e: TouchEvent) => void

	/** When fingers moved and need to update transform. */
	'pinch-transform:transform': (e: TouchEvent, transformOnScreenOrigin: DOMMatrix) => void

	/** After pinch transform completed. */
	'pinch-transform:end': (e: TouchEvent) => void
}


export class PinchTransformProcessor<E = PinchTransformEvents> extends EventFirer<E> {

	protected el: EventTarget
	protected startTouchPoint1: DOMPoint | null = null
	protected startTouchPoint2: DOMPoint | null = null
	protected eventPrefix: string = 'pinch-transform:'

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
			this.startTouchPoint1 = new DOMPoint(e.touches[0].clientX, e.touches[0].clientY)
			this.startTouchPoint2 = new DOMPoint(e.touches[1].clientX, e.touches[1].clientY)
		}

		let touchPoint1 = new DOMPoint(e.touches[0].clientX, e.touches[0].clientY)
		let touchPoint2 = new DOMPoint(e.touches[1].clientX, e.touches[1].clientY)
		let matrix = this.makeMatrix(touchPoint1, touchPoint2)

		this.fire(this.eventPrefix + 'transform' as any, ...[e, matrix] as any)
	}

	protected makeMatrix(point1: DOMPoint, point2: DOMPoint): DOMMatrix {
		let matrix = makeNonSkewMatrixFromPoints(
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


/** 
 * Make a transform matrix which will transform from two start points, to two final points.
 * Ignore skew transform.
 * See comments in `Matrix`.
 */
function makeNonSkewMatrixFromPoints(fromPoints: [DOMPoint, DOMPoint], toPoints: [DOMPoint, DOMPoint]): DOMMatrix {
	let c1 = fromPoints[0]
	let c2 = fromPoints[1]
	let c3 = toPoints[0]
	let c4 = toPoints[1]
	let c12d = new DOMPoint(c1.x - c2.x, c1.y - c2.y)

	let m = new DOMMatrix([
		 c12d.x,
		 c12d.y,
		-c12d.y,
		 c12d.x,
		 0,
		 0
	])
	
	let v = new DOMPoint(c3.x - c4.x, c3.y - c4.y)
	let {x: a, y: b} = m.invertSelf().transformPoint(v)
	let c = -b
	let d = a
	let e = c3.x - a * c1.x + b * c1.y
	let f = c3.y - b * c1.x - a * c1.y

	return new DOMMatrix([a, b, c, d, e, f])
}


