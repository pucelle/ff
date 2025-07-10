import {EventUtils} from '../../utils'
import {EventFirer, DOMEvents} from '@pucelle/lupos'
import {SimulatedEventsConfiguration} from './configuration'
import {Timeout} from '../../tools'


export interface TapEvents {

	/** 
	 * After a quick tap on touch screen.
	 * Note `tap` event will be triggered frequently when doing Apple Pencil writing,
	 * would suggest uses only `mousedown` in this case.
	 * 
	 * Otherwise you should not register both tap and mousedown / click with the same listener,
	 * Except you remember to call `endEvent.preventDefault()` to prevent following mousedown / click event.
	 */
	'tap': (endEvent: TouchEvent) => void
}


export class TapEventProcessor extends EventFirer<TapEvents> {

	private el: EventTarget
	private latestStartEvent: TouchEvent | null = null
	private timeout: Timeout

	constructor(el: EventTarget) {
		super()

		this.el = el
		this.timeout = new Timeout(this.onTimeout.bind(this), SimulatedEventsConfiguration.becomeHoldAfterDuration)
		DOMEvents.on(el, 'touchstart', this.onTouchStart as any, this, {capture: true})
	}

	private get inTouching(): boolean {
		return !!this.latestStartEvent
	}

	private onTouchStart(e: TouchEvent) {
		if (e.touches.length !== 1) {
			return
		}

		this.timeout.start()
		this.latestStartEvent = e

		DOMEvents.on(this.el, 'touchend', this.onTouchEnd as any, this)
	}

	private onTimeout() {
		this.endTouching()
	}

	private onTouchEnd(e: TouchEvent) {
		let duration = e.timeStamp - this.latestStartEvent!.timeStamp
		let startP = EventUtils.getClientPosition(this.latestStartEvent!)!
		let endP = EventUtils.getClientPosition(e)!

		let moves: Coord = {
			x: endP.x - startP.x,
			y: endP.y - startP.y,
		}
		
		let movesLength = Math.sqrt(moves.x ** 2 + moves.y ** 2)

		if (duration < SimulatedEventsConfiguration.becomeHoldAfterDuration
			&& movesLength < SimulatedEventsConfiguration.maximumMovelessDistance
		) {
			this.fire('tap', e)
		}
		
		this.fire('tap', e)
		this.endTouching()
	}

	private endTouching() {
		this.timeout.cancel()
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
