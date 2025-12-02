import {Timeout} from '../../tools'
import {EventFirer, DOMEvents} from 'lupos'
import {SimulatedEventsConfiguration} from './configuration'


export interface HoldEvents {

	/** When hold start on the touch screen and persist holding for a few time. */
	'hold:start': (e: TouchEvent) => void

	/** After hold started and touch ended. */
	'hold:end': (e: TouchEvent) => void
}

export class HoldEventProcessor extends EventFirer<HoldEvents> {

	private el: EventTarget
	private latestStartEvent: TouchEvent | null = null
	private latestStartPoint: DOMPoint | null = null
	private timeout: Timeout

	constructor(el: EventTarget) {
		super()

		this.el = el
		this.timeout = new Timeout(this.onTimeout.bind(this), SimulatedEventsConfiguration.becomeHoldAfterDuration)

		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this)
	}

	private get inTouching(): boolean {
		return !!this.latestStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		this.latestStartEvent = e

		this.latestStartPoint = new DOMPoint(
			this.latestStartEvent!.touches[0].clientX,
			this.latestStartEvent!.touches[0].clientY
		)

		this.timeout.start()

		DOMEvents.on(document, 'touchmove', this.onTouchMove as any, this)
		DOMEvents.on(document, 'touchend', this.onTouchEnd as any, this)
	}

	private onTimeout() {

		// Try to prevent text selection, but not working.
		// Must `user-select: none` on elements.
		if (this.latestStartEvent?.cancelable) {
			this.latestStartEvent.preventDefault()
		}
		
		this.fire('hold:start', this.latestStartEvent!)
	}

	private onTouchMove(e: TouchEvent) {
		if (e.touches.length !== 1) {
			this.endTouching()
			return
		}

		let moves = new DOMPoint(
			e.touches[0].clientX - this.latestStartPoint!.x,
			e.touches[0].clientY - this.latestStartPoint!.y,
		)

		let movesLength = Math.sqrt(moves.x ** 2 + moves.y ** 2)
		
		if (movesLength > SimulatedEventsConfiguration.maximumMovelessDistance) {
			this.endTouching()
		}
	}

	private onTouchEnd(e: TouchEvent) {
		this.fire('hold:end', e)
		this.endTouching()
	}

	private endTouching() {
		this.timeout.cancel()
		this.latestStartEvent = null

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