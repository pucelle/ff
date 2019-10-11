/**
 * It's common that another popup2 triggered in one existing popup1,
 * When mouse moved to popup2, popup1 which has trigger of popup2 will disappear.
 * This is not right, so we will implement a popup level:
 * When popup2 generated, we check the trigger if it is contained in any registered element,
 * of an exist mouse leave binding group.
 * If so, we lock the exist group until the current popup disappeared.
 */

const MouseLeaves: Set<MouseLeave> = new Set()


/**
 * Make sure elements and all their ancestors can't trigger mouse leave callback.
 * @param elOrs Element or array of element.
 */
export function lockOuterMouseLeave(elOrs: Element | Element[]): () => void {
	let lockedBy = getMouseLeaveThatLocks(elOrs)
	if (lockedBy) {
		lockedBy.lock()
	}

	return () => {
		if (lockedBy) {
			lockedBy.unlock()
		}
	}
}


function getMouseLeaveThatLocks(elOrs: Element | Element[]): MouseLeave | null {
	let els = Array.isArray(elOrs) ? elOrs : [elOrs]

	for (let existing of [...MouseLeaves].reverse()) {
		for (let el of els) {
			// Elements should not equal because some old not `mouseIn` but will be reused elements should be ignored
			if (existing.els.some(existingEl => existingEl.contains(el) && existingEl !== el)) {
				return existing
			}
		}
	}

	return null
}


/**
 * Check if element or any of it's ancestors was locked and can't be released for reusing.
 * @param el Element to check.
 */
export function isMouseLeaveLockedAt(elOrs: Element | Element[]): boolean {
	let els = Array.isArray(elOrs) ? elOrs : [elOrs]

	for (let existing of [...MouseLeaves].reverse()) {
		for (let el of els) {
			if (existing.els.some(existingEl => existingEl.contains(el))) {
				return existing.mouseIn
			}
		}
	}

	return false
}


/**
 * Call callback after mouse leaves all of the elements. It's very usefull to handle mouse hover event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback. Default value is 200.
 * @param callback The callback to call after mouse leaves all the elements.
 */
export function onMouseLeaveAll(elOrs: Element | Element[], callback: () => void, ms: number = 200): () => void {
	let binding = new MouseLeave(false, elOrs, callback, ms)
	return () => binding.cancel()
}


/**
 * Call callback after mouse leaves all of the elements only for once, its very usefull to handle mouse event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback. Default value is 200.
 * @param callback The callback to call after mouse leaves all the elements.
 */
export function onceMouseLeaveAll(elOrs: Element | Element[], callback: () => void, ms: number = 200): () => void {
	let binding = new MouseLeave(true, elOrs, callback, ms)
	return () => binding.cancel()
}


class MouseLeave {

	els: Element[]
	mouseIn: boolean = false

	// Why not a boolean property?
	// When a sub popup hide, it will trigger unlock on binding later, not immediately.
	// But a new sub popup may trigger lock on binding, and then old sub popup trigger unlock.
	// `lock -> lock -> unlock`, cause binding to be canceled.
	private lockCount: number = 0

	private isOnce: boolean
	private callback: () => void
	private ms: number
	private ended: boolean = false
	private timer: ReturnType<typeof setTimeout> | null = null
	private unlockOuterMouseLeave: () => void

	constructor(isOnce: boolean, elOrs: Element | Element[], callback: () => void, ms: number) {
		this.isOnce = isOnce
		this.els = Array.isArray(elOrs) ? elOrs : [elOrs]
		this.callback = callback
		this.ms = ms

		this.onMouseEnter = this.onMouseEnter.bind(this)
		this.onMouseLeave = this.onMouseLeave.bind(this)
		
		for (let el of this.els) {
			el.addEventListener('mouseenter', this.onMouseEnter, false)
			el.addEventListener('mouseleave', this.onMouseLeave, false)
		}

		this.unlockOuterMouseLeave = lockOuterMouseLeave(elOrs)
		MouseLeaves.add(this)

	}

	private onMouseEnter() {
		this.mouseIn = true
		this.clearTimeout()
	}

	private onMouseLeave() {
		this.mouseIn = false

		if (this.lockCount === 0) {
			this.startTimeout()
		}
	}

	private startTimeout() {
		this.clearTimeout()

		this.timer = setTimeout(() => {
			this.timer = null

			if (!this.mouseIn) {
				this.flush()
			}
		}, this.ms)
	}

	private clearTimeout() {
		if (this.timer) {
			clearTimeout(this.timer)
			this.timer = null
		}
	}

	flush() {
		if (this.ended) {
			return
		}

		if (this.isOnce) {
			this.cancel()
		}

		this.callback()
	}

	cancel() {
		if (this.ended) {
			return
		}
		
		this.clearTimeout()

		for (let el of this.els) {
			el.removeEventListener('mouseenter', this.onMouseEnter, false)
			el.removeEventListener('mouseleave', this.onMouseLeave, false)
		}

		this.ended = true
		this.unlockOuterMouseLeave()
		MouseLeaves.delete(this)
	}

	lock() {
		this.clearTimeout()
		this.lockCount++
	}

	unlock() {
		this.lockCount--

		if (this.lockCount === 0) {
			if (!this.mouseIn) {
				this.flush()
			}
		}
	}
}