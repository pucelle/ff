import {MathUtils, Vector, Direction} from '../../math'
import {EventFirer, DOMEvents} from '@pucelle/lupos'
import {SimulatedEventsConfiguration} from './configuration'
import {EventUtils} from '../../utils'


export interface SlideEvents {

	/** After sliding enough pixels at a direction on a touch screen. */
	'slide': (e: TouchEvent, direction: Direction) => void
}


export class SlideEventProcessor extends EventFirer<SlideEvents> {

	private el: EventTarget
	private latestStartEvent: TouchEvent | null = null

	constructor(el: EventTarget) {
		super()

		this.el = el
		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this, {capture: true})
	}

	private get inTouching(): boolean {
		return !!this.latestStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		this.latestStartEvent = e

		DOMEvents.on(this.el, 'touchend', this.onTouchEnd as any, this)
	}

	private onTouchEnd(e: TouchEvent) {
		let duration = e.timeStamp - this.latestStartEvent!.timeStamp
		let startP = EventUtils.getClientPosition(this.latestStartEvent!)!
		let endP = EventUtils.getClientPosition(e)!

		let move = new Vector(
			endP.x - startP.x,
			endP.y - startP.y,
		)

		let direction = this.getSlideDirection(move)

		if (duration <= SimulatedEventsConfiguration.maximumSlideDuration
			&& move.getLength() >= SimulatedEventsConfiguration.minimumSlideDistance
			&& direction
		) {
			this.fire('slide', e, direction)
		}
		
		this.endTouching()
	}

	/** Get slide direction. */
	private getSlideDirection(move: Vector): Direction | null {
		let direction = Direction.straightFromVector(move)
		let v = direction.toVector()

		// Angle must lower than configured angle.
		let correctAngle = v.dot(move.normalize())
			> Math.cos(MathUtils.degreeToRadians(SimulatedEventsConfiguration.minimumSlideAngle))

		return correctAngle ? direction : null
	}

	private endTouching() {
		this.latestStartEvent = null
		DOMEvents.off(this.el, 'touchend', this.onTouchEnd as any, this)
	}

	remove() {
		if (this.inTouching) {
			this.endTouching()
		}

		DOMEvents.off(this.el, 'touchstart', this.onTouchStart as any, this)
	}
}