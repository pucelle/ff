/**
 * Call callback after mouse leaves all of the elements. It's very usefull to handle mouse hover event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback.
 * @param callback The callback to call after mouse leaves all the elements.
 */
export function onMouseLeaveAll(elOrs: Element | Element[], callback: () => void, ms: number = 200): () => void {
	return bindMouseLeaveAll(false, elOrs, callback, ms)
}


/**
 * Call callback after mouse leaves all of the elements only for once, its very usefull to handle mouse event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback.
 * @param callback The callback to call after mouse leaves all the elements.
 */
export function onceMouseLeaveAll(elOrs: Element | Element[], callback: () => void, ms: number = 200): () => void {
	return bindMouseLeaveAll(true, elOrs, callback, ms)
}


function bindMouseLeaveAll(isOnce: boolean, elOrs: Element | Element[], callback: () => void, ms: number): () => void {
	let els = Array.isArray(elOrs) ? elOrs : [elOrs]
	let mouseIn = false
	let ended = false
	let timer: ReturnType<typeof setTimeout> | null = null

	function onMouseEnter() {
		mouseIn = true
		clear()
	}

	function onMouseLeave() {
		mouseIn = false
		clear()

		timer = setTimeout(function () {
			timer = null

			if (!mouseIn) {
				flush()
			}
		}, ms)
	}

	function clear() {
		if (timer) {
			clearTimeout(timer)
			timer = null
		}
	}

	function flush() {
		if (ended) {
			return
		}

		if (isOnce) {
			cancel()
		}

		callback()
	}

	function cancel() {
		if (timer) {
			clearTimeout(timer)
		}

		for (let el of els) {
			el.removeEventListener('mouseenter', onMouseEnter, false)
			el.removeEventListener('mouseleave', onMouseLeave, false)
		}

		ended = true
	}

	for (let el of els) {
		el.addEventListener('mouseenter', onMouseEnter, false)
		el.addEventListener('mouseleave', onMouseLeave, false)
	}

	return cancel
}