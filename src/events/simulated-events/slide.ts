import {EventFirer, DOMEvents} from '@pucelle/lupos'
import {SimulatedEventsConfiguration} from './configuration'
import {EventUtils} from '../../utils'
import {Coord, BoxOffsetKey} from '../../math'


export interface SlideEvents {

	/** After sliding enough pixels at a direction on a touch screen. */
	'slide': (e: TouchEvent, direction: BoxOffsetKey) => void
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

		let moves: Coord = {
			x: endP.x - startP.x,
			y: endP.y - startP.y,
		}

		let movesLength = Math.sqrt(moves.x ** 2 + moves.y ** 2)
		let direction = this.getSlideDirection(moves)

		if (duration <= SimulatedEventsConfiguration.maximumSlideDuration
			&& movesLength >= SimulatedEventsConfiguration.minimumSlideDistance
			&& direction
		) {
			this.fire('slide', e, direction)
		}
		
		this.endTouching()
	}

	/** Get slide direction. */
	private getSlideDirection(moves: Coord): BoxOffsetKey | null {
		let direction = straightFromVector(moves)
		if (direction === null) {
			return null
		}

		let v = directionToVector(direction)

		// Angle must lower than configured angle.
		// Dot of `v` and `moves` normalized should lower than cos value of minimum
		let correctAngle = (v.x * moves.x + v.y * moves.y) / Math.sqrt(moves.x ** 2 + moves.y ** 2)
			> Math.cos(SimulatedEventsConfiguration.minimumSlideAngle / 180 * Math.PI)

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


/** Make a straight direction from a vector, choose dominate direction when it's oblique. */
function straightFromVector(v: Coord): BoxOffsetKey | null {
	let {x, y} = v
	let absX = Math.abs(v.x)
	let absY = Math.abs(v.y)

	if (x < 0 && absX >= absY) {
		return 'left'
	}
	else if (x > 0 && absX >= absY) {
		return 'right'
	}
	else if (y < 0 && absX <= absY) {
		return 'top'
	}
	else if (y > 0 && absX <= absY) {
		return 'bottom'
	}
	else {
		return null
	}
}

function directionToVector(d: BoxOffsetKey) {
	if (d === 'left') {
		return {x: -1, y: 0}
	}
	else if (d === 'right') {
		return {x: 1, y: 0}
	}
	else if (d === 'top') {
		return {x: 0, y: -1}
	}
	else {
		return {x: 0, y: 1}
	}
}