import {Point} from '../../../math'
import {Timeout} from '../../../utils'
import * as DOMEvents from '../../dom-events'
import {EventFirer} from '../../event-firer'
import {SimulatedEventsConfiguration} from '../simulated-events-configuration'


export interface HoldEvents {

	/** When hold start on the touch screen and persist holding for a few time. */
	'hold:start': (e: TouchEvent) => void

	/** After hold started and touch ended. */
	'hold:end': (e: TouchEvent) => void
}

export class HoldEventProcessor extends EventFirer<HoldEvents> {

	private el: EventTarget
	private cachedTouchStartEvent: TouchEvent | null = null
	private cachedTouchStartPoint: Point | null = null
	private timeout: Timeout

	constructor(el: EventTarget) {
		super()

		this.el = el
		this.timeout = new Timeout(this.onTimeout.bind(this), SimulatedEventsConfiguration.becomeHoldAfterDuration)

		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this)
	}

	private get inTouching(): boolean {
		return !!this.cachedTouchStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		this.cachedTouchStartEvent = e

		this.cachedTouchStartPoint = new Point(
			this.cachedTouchStartEvent!.touches[0].clientX,
			this.cachedTouchStartEvent!.touches[0].clientY
		)

		this.timeout.start()

		DOMEvents.on(document, 'touchmove', this.onTouchMove as any, this)
		DOMEvents.on(document, 'touchend', this.onTouchEnd as any, this)
	}

	private onTimeout() {

		// Try to prevent text selection, but not working.
		// Must `user-select: none` on elements.
		if (this.cachedTouchStartEvent?.cancelable) {
			this.cachedTouchStartEvent.preventDefault()
		}
		
		this.fire('hold:start', this.cachedTouchStartEvent!)
	}

	private onTouchMove(e: TouchEvent) {
		if (e.touches.length !== 1) {
			this.endTouching()
			return
		}

		let moves = new Point(
			e.touches[0].clientX,
			e.touches[0].clientY
		).diff(this.cachedTouchStartPoint!)

		if (moves.getLength() > SimulatedEventsConfiguration.maximumMovelessDistance) {
			this.endTouching()
		}
	}

	private onTouchEnd(e: TouchEvent) {
		this.fire('hold:end', e)
		this.endTouching()
	}

	private endTouching() {
		this.timeout.cancel()
		this.cachedTouchStartEvent = null

		DOMEvents.off(document, 'touchmove', this.onTouchMove as any, this)
		DOMEvents.off(document, 'touchend', this.endTouching as any, this)
	}

	remove() {
		if (this.inTouching) {
			this.endTouching()
		}

		DOMEvents.off(this.el, 'touchstart', this.onTouchStart as any, this)
	}
}