import {DOMEvents} from '@pucelle/lupos'
import {Point, Vector} from '../math'


export interface MouseMovementOptions {

	/** At least moves for this to start calls `onMove`. */
	minimumMoves: number
}

const DefaultMouseMovementOptions: MouseMovementOptions = {
	minimumMoves: 0
}


/** 
 * Handle dragging like.
 * Start by mousedown event.
 */
export class MouseMovement {

	/** 
	 * Specifies this to handle movement.
	 * First parameter is movement from event start.
	 * Second parameter is movement from previous.
	 */
	onMove: ((moves: Vector, latestMoves: Vector, e: MouseEvent) => void) | null = null

	/** Handle after movement end. */
	onEnd: ((e: MouseEvent) => void) | null = null

	protected options: MouseMovementOptions
	protected startPoint: Point
	protected latestPosition: Point
	protected started: boolean = false
	
	constructor(e: MouseEvent, options: Partial<MouseMovementOptions> = {}) {
		this.options = {...DefaultMouseMovementOptions, ...options}
		this.startPoint = this.latestPosition = new Point(e.clientX, e.clientY)

		DOMEvents.on(document, 'mousemove', this.onDragMove, this)
		DOMEvents.once(document, 'mouseup', this.onDragEnd, this)
	}

	protected onDragMove(e: MouseEvent) {
		let eventPoint = new Point(e.clientX, e.clientY)
		let moves = eventPoint.diff(this.startPoint)
		let latestMoves = eventPoint.diff(this.latestPosition)

		this.latestPosition = eventPoint

		if (!this.started) {
			if (moves.getLength() > this.options.minimumMoves) {
				this.started = true
			}
			else {
				return
			}
		}

		this.onMove?.(moves, latestMoves, e)
	}

	protected onDragEnd(e: MouseEvent) {
		this.end()
		this.onEnd?.(e)
	}

	end() {
		DOMEvents.off(document, 'mousemove', this.onDragMove, this)
		DOMEvents.off(document, 'mouseup', this.onDragEnd, this)
	}
}