import {setStyle} from './css'


/**
 * Handle pan event on mobile devices.
 * @param el The element to bind pan event.
 * @param callback The callback to call when pan event emitted, accept one argument diection to be `'l' | 'r' | 't' | 'b'`.
 */
export function onPan(el: HTMLElement, callback: (direction: 'l' | 'r' | 't' | 'b') => void): () => void {
	let startX: number
	let startY: number

	function onTouchStart(e: TouchEvent) {
		setStyle(el, 'transition', 'none')

		startX = e.changedTouches[0].pageX
		startY = e.changedTouches[0].pageY

		document.addEventListener('touchmove', onTouchMove, false)
		document.addEventListener('touchend', onTouchEnd, false)
	}

	function onTouchMove(e: TouchEvent) {
		let x = e.changedTouches[0].pageX
		let y = e.changedTouches[0].pageY

		let movedX = x - startX
		let movedY = y - startY

		if (Math.abs(movedX / movedY) > 1) {
			e.preventDefault()
			setStyle(el, 'transform', `translateX(${movedX}px)`)
		}
	}

	function onTouchEnd(e: TouchEvent) {
		setStyle(el, {transition: '', transform: ''})

		document.removeEventListener('touchmove', onTouchMove, false)
		document.removeEventListener('touchend', onTouchEnd, false)

		let x = e.changedTouches[0].pageX
		let y = e.changedTouches[0].pageY

		let movedX = x - startX
		let movedY = y - startY

		if (Math.abs(movedX / movedY) > 1 && Math.abs(movedX) > 20) {
			e.preventDefault()

			if (movedX > 0) {
				callback('l')
			}
			else {
				callback('r')
			}
		}
		else if (Math.abs(movedX / movedY) < 1 && Math.abs(movedY) > 20) {
			e.preventDefault()

			if (movedY > 0) {
				callback('b')
			}
			else {
				callback('t')
			}
		}
	}

	el.addEventListener('touchstart', onTouchStart, false)

	return function cancelPan() {
		el.removeEventListener('touchstart', onTouchStart, false)
	}
}