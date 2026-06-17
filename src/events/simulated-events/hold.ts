import {Timeout} from '../../tools'
import {EventFirer, DOMEvents} from 'lupos'
import {SimulatedEventsConfig, SimulatedEventsOptions} from './config'


export interface HoldEvents {

	/** When hold start on the touch screen and persist holding for a few time. */
	'hold:start': (e: TouchEvent) => void

	/** After hold started and touch ended. */
	'hold:end': (e: TouchEvent) => void
}

export class HoldEventProcessor extends EventFirer<HoldEvents> {

	private el: EventTarget
	private options: SimulatedEventsOptions
	private latestStartEvent: TouchEvent | null = null
	private latestStartPoint: DOMPoint | null = null
	private holdStarted: boolean = false
	private timeout: Timeout
	
	constructor(el: EventTarget, options: SimulatedEventsOptions = {}) {
		super()

		this.el = el
		this.options = options

		let becomeHoldAfterDuration = options.becomeHoldAfterDuration ?? SimulatedEventsConfig.becomeHoldAfterDuration
		this.timeout = new Timeout(this.onTimeout.bind(this), becomeHoldAfterDuration)

		DOMEvents.on(el, 'touchstart', this.onTouchStart, this)
	}

	private get inTouching(): boolean {
		return !!this.latestStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		if (this.options.prevent) {
			e.preventDefault()
		}

		if (this.options.stop) {
			e.stopPropagation()
		}

		this.latestStartEvent = e

		this.latestStartPoint = new DOMPoint(
			this.latestStartEvent!.touches[0].clientX,
			this.latestStartEvent!.touches[0].clientY
		)

		this.timeout.start()

		DOMEvents.on(document, 'touchmove', this.onTouchMove, this)
		DOMEvents.on(document, 'touchend', this.onTouchEnd, this)
	}

	private onTimeout() {
		this.holdStarted = true
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
		let maximumMovelessDistance = this.options.maximumMovelessDistance ?? SimulatedEventsConfig.maximumMovelessDistance

		if (movesLength > maximumMovelessDistance) {
			this.endTouching()
		}
	}

	private onTouchEnd(e: TouchEvent) {

		// Avoid following click events fires.
		if (this.holdStarted) {
			e.preventDefault()
			e.stopPropagation()
		}

		this.fire('hold:end', e)
		this.endTouching()
	}

	private endTouching() {
		this.timeout.cancel()
		this.latestStartEvent = null
		this.holdStarted = false

		DOMEvents.off(document, 'touchmove', this.onTouchMove, this)
		DOMEvents.off(document, 'touchend', this.endTouching, this)
	}

	remove() {
		if (this.inTouching) {
			this.endTouching()
		}

		DOMEvents.off(this.el, 'touchstart', this.onTouchStart, this)
	}
}