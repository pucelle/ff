import {getNumeric, setStyle} from './css'


/**
 * Set element draggable that it can be dragged by mouse.
 * @param el The element which will handle mouse event.
 * @param mover The element that moves with the mouse.
 */
export function setDraggable(el: HTMLElement, mover: HTMLElement = el): () => void {
	let relX: number
	let relY: number
	let minX: number
	let minY: number

	function onMouseDown(e: MouseEvent) {
		let left = getNumeric(mover, 'left') || 0
		let top  = getNumeric(mover, 'top')  || 0
		let w    = mover.offsetWidth
		let h    = mover.offsetHeight
		let dw   = document.documentElement.clientWidth
		let dh   = document.documentElement.clientHeight

		relX = left - e.clientX
		relY = top - e.clientY
		minX = dw - w
		minY = dh - h

		setStyle(mover, 'willChange', 'top left')
		document.addEventListener('mousemove', onMouseMove, false)
		document.addEventListener('mouseup',   onMouseUp,   false)
	}

	function onMouseMove(e: MouseEvent) {
		e.preventDefault()

		let x = relX + e.clientX
		let y = relY + e.clientY

		x = Math.min(Math.max(x, 0), minX)
		y = Math.min(Math.max(y, 0), minY)

		setStyle(mover, 'left', x)
		setStyle(mover, 'top',  y)
	}

	function onMouseUp() {
		setStyle(mover, 'willChange', '')
		document.removeEventListener('mousemove', onMouseMove, false)
		document.removeEventListener('mouseup',   onMouseUp,   false)
	}

	el.addEventListener('mousedown', onMouseDown, false)

	return function cancelMovable () {
		el.removeEventListener('mousedown', onMouseDown, false)
	}
}