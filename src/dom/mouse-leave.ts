/**
 * It's common that another popup2 triggered in one existing popup1,
 * When mouse moved to popup2, popup1 which has trigger of popup2 will disappear.
 * This is not right, so we will implement a popup level:
 * When popup2 generated, we check the trigger if it is contained in any registered element,
 * of an exist mouse leave binding group.
 * If so, we lock the exist group until the current popup disappeared.
 */

const MouseLeaveBindings: Set<MouseLeaveBinding> = new Set()
const LockingBindings: Map<MouseLeaveBinding, MouseLeaveBinding> = new Map()

function onBindingCreated(binding: MouseLeaveBinding) {
	for (let existingBinding of [...MouseLeaveBindings].reverse()) {
		for (let el of binding.els) {
			if (existingBinding.els.some(existingEl => existingEl.contains(el) && existingEl !== el)) {
				existingBinding.lock()
				LockingBindings.set(binding, existingBinding)
				break
			}
		}
	}

	MouseLeaveBindings.add(binding)
}

function onBindingDeleted(binding: MouseLeaveBinding) {
	let lockingBinding = LockingBindings.get(binding)
	if (lockingBinding) {
		lockingBinding.unlock()
		LockingBindings.delete(binding)
	}

	MouseLeaveBindings.delete(binding)
}


/**
 * Call callback after mouse leaves all of the elements. It's very usefull to handle mouse hover event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback. Default value is 200.
 * @param callback The callback to call after mouse leaves all the elements.
 */
export function onMouseLeaveAll(elOrs: Element | Element[], callback: () => void, ms: number = 200): () => void {
	let binding = new MouseLeaveBinding(false, elOrs, callback, ms)
	return () => binding.cancel()
}


/**
 * Call callback after mouse leaves all of the elements only for once, its very usefull to handle mouse event in menu & submenu.
 * @param elOrs The element array to capture leave at.
 * @param ms If mouse leaves all the element and don't enter elements again, call callback. Default value is 200.
 * @param callback The callback to call after mouse leaves all the elements.
 */
export function onceMouseLeaveAll(elOrs: Element | Element[], callback: () => void, ms: number = 200): () => void {
	let binding = new MouseLeaveBinding(true, elOrs, callback, ms)
	return () => binding.cancel()
}


class MouseLeaveBinding {

	els: Element[]

	private locked: boolean = false
	private isOnce: boolean
	private callback: () => void
	private ms: number
	private mouseIn: boolean = false
	private ended: boolean = false
	private timer: ReturnType<typeof setTimeout> | null = null

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

		onBindingCreated(this)
	}

	private onMouseEnter() {
		this.mouseIn = true
		this.clearTimeout()
	}

	private onMouseLeave() {
		this.mouseIn = false
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

		if (!this.locked) {
			this.callback()
		}
	}

	cancel() {
		if (this.timer) {
			clearTimeout(this.timer)
		}

		for (let el of this.els) {
			el.removeEventListener('mouseenter', this.onMouseEnter, false)
			el.removeEventListener('mouseleave', this.onMouseLeave, false)
		}

		this.ended = true
		onBindingDeleted(this)
	}

	lock() {
		this.locked = true
	}

	unlock() {
		this.locked = false

		if (!this.mouseIn) {
			this.flush()
		}
	}
}