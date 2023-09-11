import {MathUtils, Vector, Direction} from '../../../../math'
import {DOMEvents} from '../../dom-events'
import {EventFirer} from '../../event-firer'
import {SimulatedEventsConfiguration} from '../simulated-events-configuration'


export interface SlideEvents {

	/** After sliding enough pixels at a direction. */
	'slide': (e: TouchEvent, direction: Direction) => void
}


export class SlideEventProcessor extends EventFirer<SlideEvents> {

	private el: EventTarget
	private cachedTouchStartEvent: TouchEvent | null = null

	constructor(el: EventTarget) {
		super()

		this.el = el
		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this, true)
	}

	private get inTouching(): boolean {
		return !!this.cachedTouchStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		this.cachedTouchStartEvent = e

		DOMEvents.on(this.el, 'touchend', this.onTouchEnd as any, this)
	}

	private onTouchEnd(e: TouchEvent) {
		let duration = e.timeStamp - this.cachedTouchStartEvent!.timeStamp
		let startE = DOMEvents.toSingle(this.cachedTouchStartEvent!)!
		let endE = DOMEvents.toSingle(e)!

		let move = new Vector(
			endE.clientX - startE.clientX,
			endE.clientY - startE.clientY,
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
		this.cachedTouchStartEvent = null
		DOMEvents.off(this.el, 'touchend', this.onTouchEnd as any, this)
	}

	remove() {
		if (this.inTouching) {
			this.endTouching()
		}

		DOMEvents.off(this.el, 'touchstart', this.onTouchStart as any, this)
	}
}