import {Vector} from '../../math'
import {Timeout} from '../../utils'
import {EventFirer, DOMEvents} from '@pucelle/lupos'
import {SimulatedEventsConfiguration} from './configuration'


export interface DoubleTapEvents {

	/** 
	 * After double tapping on touch screen.
	 * double tap event has no conflict with `dblclick`,
	 * normally they wouldn't be triggered both.
	 */
	'double-tap': (e: TouchEvent) => void
}


export class DoubleTapEventProcessor extends EventFirer<DoubleTapEvents> {

	private el: EventTarget
	private timeout: Timeout
	private latestStartEvent: TouchEvent | null = null
	private touchCount: number = 0

	constructor(el: EventTarget) {
		super()

		this.el = el
		this.timeout = new Timeout(this.onTimeout.bind(this), SimulatedEventsConfiguration.maximumDoubleTapDuration)

		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this)
	}

	private get inTouching(): boolean {
		return !!this.latestStartEvent
	}

	private onTimeout() {
		this.endTouching()
	}

	private onTouchStart(e: TouchEvent) {

		// Multi touches.
		if (e.touches.length !== 1) {
			if (this.inTouching) {
				this.endTouching()
				return
			}
		}
		
		// First touch start.
		if (!this.latestStartEvent) {
			this.handleFirstTouch(e)
		}

		// Second touch start.
		else {
			this.handleSecondTouch(e)
		}

		this.touchCount++
	}

	private handleFirstTouch(e: TouchEvent) {
		this.latestStartEvent = e
		this.timeout.start()

		DOMEvents.on(document, 'touchmove', this.onTouchMove as any, this)
		DOMEvents.on(document, 'touchend', this.onTouchEnd as any, this)
	}

	private handleSecondTouch(e: TouchEvent) {
		let diff = new Vector(
			e.touches[0].clientX - this.latestStartEvent!.touches[0].clientX,
			e.touches[0].clientY - this.latestStartEvent!.touches[0].clientY
		)

		// Moved much, set current as first touch.
		if (diff.getLength() > SimulatedEventsConfiguration.maximumMovelessDistance) {
			this.resetFirstTouch(e)
		}

		// Touch continue.
		// Avoid browser's dblclick event trigger, but it may cause click and mousedown event triggers.
		else if (e.cancelable) {
			e.preventDefault()
		}
	}

	private resetFirstTouch(e: TouchEvent) {
		this.latestStartEvent = e
		this.touchCount = 0
	}

	private onTouchMove(e: TouchEvent) {
		if (e.touches.length !== 1) {
			this.endTouching()
			return
		}

		let moves = new Vector(
			e.touches[0].clientX - this.latestStartEvent!.touches[0].clientX,
			e.touches[0].clientY - this.latestStartEvent!.touches[0].clientY
		)

		// Moved much.
		if (moves.getLength() > SimulatedEventsConfiguration.maximumMovelessDistance) {
			this.endTouching()
		}
	}

	private onTouchEnd(e: TouchEvent) {
		if (this.touchCount < 2) {
			this.onFirstTouchEnd()
		}
		else {
			this.onSecondTouchEnd(e)
			this.endTouching()
		}
	}

	private onFirstTouchEnd() {}

	private onSecondTouchEnd(_e: TouchEvent) {
		this.fire('double-tap', this.latestStartEvent!)
	}

	private endTouching() {
		this.timeout.cancel()
		this.latestStartEvent = null
		this.touchCount = 0

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