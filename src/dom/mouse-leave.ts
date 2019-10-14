/**
 * It's common that popup2 triggered from an existing popup1,
 * later when mouse moved to popup2, popup1 will disappear because mouse leaves.
 * 
 * This is not correct, so we implement a mouse leave stack:
 *   1. When popup2 generated, we check the trigger element if it was contained (not equal) in elements of existing popups.
 *   2. If so, we lock the exist popup until popup2 disappeared.
 * 
 * Caution: never forget to unregister mouse leave binding before elements disconnected.
 */
export namespace MouseLeave {

	const Controllers: Set<MouseLeaveController> = new Set()

	/**
	 * Make sure elements and all their ancestors can't trigger mouse leave callback and becomes invisible.
	 * Normally used for contextmenu to keep parent popup showing.
	 * @param elOrS Element or array of element.
	 */
	export function keep(elOrS: Element | Element[]): () => void {
		let controller = getControllerContains(elOrS)
		if (controller) {
			controller.lock()
		}
	
		return () => {
			if (controller) {
				controller.unlock()
				controller = null
			}
		}
	}
	
	
	// Contains but not equals, because trigger button or popup will be reused soon.
	// If we allow them to equal, it will tell you popup1 contains popup1 and already in use.
	function getControllerContains(elOrS: Element | Element[]): MouseLeaveController | null {
		let els = Array.isArray(elOrS) ? elOrS : [elOrS]
	
		for (let controller of [...Controllers].reverse()) {
			for (let el of els) {
				if (controller.els.some(controllerEl => controllerEl.contains(el) && controllerEl !== el)) {
					return controller
				}
			}
		}

		return null
	}
	
	
	/**
	 * Check if element or any of it's ancestors was kept to be visible.
	 * If element is not been kept, you can destroy or reuse it immediately.
	 * It allows `el` equals to controller element.
	 * @param el Element to check.
	 */
	export function isKeeping(el: Element): boolean {
		for (let controller of [...Controllers].reverse()) {
			if (controller.els.some(controllerEl => controllerEl.contains(el))) {
				return controller.mouseIn
			}
		}
	
		return false
	}
	
	
	/**
	 * Call `callback` after mouse leaves all of the elements for `ms` milliseconds.
	 * It's very usefull to handle mouse hover event in menu & submenu.
	 * @param elOrS The element array to capture leave at.
	 * @param ms If mouse leaves all the element and don't enter elements again, call callback. Default value is 200.
	 * @param callback The callback to call after mouse leaves all the elements.
	 */
	export function on(elOrS: Element | Element[], callback: () => void, ms: number = 200): () => void {
		let controller = new MouseLeaveController(false, elOrS, callback, ms)
		return () => controller.cancel()
	}
	
	
	/**
	 * Call `callback` after mouse leaves all of the elements for `ms` milliseconds, only trigger `callback` for once.
	 * It's very usefull to handle mouse event in menu & submenu.
	 * @param elOrS The element array to capture leave at.
	 * @param ms If mouse leaves all the element and don't enter elements again, call callback. Default value is 200.
	 * @param callback The callback to call after mouse leaves all the elements.
	 */
	export function once(elOrS: Element | Element[], callback: () => void, ms: number = 200): () => void {
		let controller = new MouseLeaveController(true, elOrS, callback, ms)
		return () => controller.cancel()
	}
	
	
	class MouseLeaveController {
	
		els: Element[]
		mouseIn: boolean = false
	
		// Why not a boolean property?
		// When a sub popup hide, it will trigger unlock on ontroller later, not immediately.
		// But a new sub popup may trigger lock on ontroller, and then old sub popup trigger unlock.
		// `old lock -> new lock -> old unlock`, cause controller to be canceled.
		private lockCount: number = 0
	
		private isOnce: boolean
		private callback: () => void
		private ms: number
		private ended: boolean = false
		private timer: ReturnType<typeof setTimeout> | null = null
		private unkeep: () => void
	
		constructor(isOnce: boolean, elOrS: Element | Element[], callback: () => void, ms: number) {
			this.isOnce = isOnce
			this.els = Array.isArray(elOrS) ? elOrS : [elOrS]
			this.callback = callback
			this.ms = ms
	
			this.onMouseEnter = this.onMouseEnter.bind(this)
			this.onMouseLeave = this.onMouseLeave.bind(this)
			
			for (let el of this.els) {
				el.addEventListener('mouseenter', this.onMouseEnter, false)
				el.addEventListener('mouseleave', this.onMouseLeave, false)
			}
	
			this.unkeep = keep(elOrS)
			Controllers.add(this)
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
			this.timer = setTimeout(() => this.onTimeout(), this.ms)
		}

		private onTimeout() {
			this.timer = null
	
			if (!this.mouseIn) {
				this.flush()
			}
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
			this.unkeep()
			Controllers.delete(this)
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
}
