import {Vector} from '../../../math'
import {Timeout} from '../../../utils'
import {DOMEvents} from '../../dom-events'
import {EventFirer} from '../../event-firer'
import {SimulatedEventsConfiguration} from '../simulated-events-configuration'


export interface TapEvents {

	/** 
	 * After a quick tap.
	 * Note `tap` event will be triggered frequently when doing Apple Pencil writting,
	 * would suggest using only `mousedown` in this case.
	 * Otherwise you should not register both tap and mousedown / click with the same listener,
	 * Except you remember to call `endEvent.preventDefault()` to prevent following mousedown / click event.
	 */
	'tap': (endEvent: TouchEvent) => void
}


export class TapEventProcessor extends EventFirer<TapEvents> {

	private el: EventTarget
	private cachedTouchStartEvent: TouchEvent | null = null
	private timeout: Timeout

	constructor(el: EventTarget) {
		super()

		this.el = el
		this.timeout = new Timeout(this.onTimeout.bind(this), SimulatedEventsConfiguration.becomeHoldAfterDuration)
		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this, true)
	}

	private get inTouching(): boolean {
		return !!this.cachedTouchStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		this.timeout.start()
		this.cachedTouchStartEvent = e

		DOMEvents.on(this.el, 'touchend', this.onTouchEnd as any, this)
	}

	private onTimeout() {
		this.endTouching()
	}

	private onTouchEnd(e: TouchEvent) {
		let duration = e.timeStamp - this.cachedTouchStartEvent!.timeStamp
		let startE = DOMEvents.toSingle(this.cachedTouchStartEvent!)!
		let endE = DOMEvents.toSingle(e)!

		let diff = new Vector(
			endE.clientX - startE.clientX,
			endE.clientY - startE.clientY
		)
		
		if (duration < SimulatedEventsConfiguration.becomeHoldAfterDuration
			&& diff.getLength() < SimulatedEventsConfiguration.maximumMovelessDistance
		) {
			this.fire('tap', e)
		}
		
		this.fire('tap', e)
		this.endTouching()
	}

	private endTouching() {
		this.timeout.cancel()
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
