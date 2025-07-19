import {DOMEvents} from '@pucelle/lupos'
import {Coord} from '../math'


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
	onMove: ((moves: Coord, latestMoves: Coord, e: MouseEvent) => void) | null = null

	/** Handle after movement end. */
	onEnd: ((e: MouseEvent) => void) | null = null

	protected options: MouseMovementOptions
	protected startPoint: DOMPoint
	protected latestPosition: DOMPoint
	protected started: boolean = false
	
	constructor(e: MouseEvent, options: Partial<MouseMovementOptions> = {}) {
		this.options = {...DefaultMouseMovementOptions, ...options}
		this.startPoint = this.latestPosition = new DOMPoint(e.clientX, e.clientY)

		DOMEvents.on(document, 'mousemove', this.onDragMove, this)
		DOMEvents.once(document, 'mouseup', this.onDragEnd, this)
	}

	protected onDragMove(e: MouseEvent) {
		let eventPoint = new DOMPoint(e.clientX, e.clientY)
		let moves: Coord = {x: eventPoint.x - this.startPoint.x, y: eventPoint.y - this.startPoint.y}
		let latestMoves: Coord = {x: eventPoint.x - this.latestPosition.x, y: eventPoint.y - this.latestPosition.y}

		this.latestPosition = eventPoint

		if (!this.started) {
			let movesLength = Math.sqrt(moves.x ** 2 + moves.y ** 2)
			if (movesLength > this.options.minimumMoves) {
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