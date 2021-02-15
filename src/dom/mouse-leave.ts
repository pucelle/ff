/** Options for mouse leave control. */
export interface MouseLeaveOptions {

	/** If mouse leaves all the elements and doesn't enter again, call callback. Default value is `200`. */
	delay?: number

	/** When already knows that mouse is inside any of current elements, set this to `true`. */
	mouseIn?: boolean
}


/**
 * It's common that popup2 triggered from an existing popup1,
 * later when mouse moved to popup2, popup1 should disappear because mouse leaves.
 * This is not correct, so we implemented a mouse popup stack and keep parent visible when child still having mouse inside.
 * 
 * Caution: never forget to unregister mouse leave binding before elements disconnected.
 */
export namespace MouseLeave {

	/** Mouse leave controllers. */
	const Controllers: Set<MouseLeaveController> = new Set()

	/**
	 * Make sure elements and all their ancestors can't trigger mouse leave callback and always visible.
	 * Normally used for contextmenu to keep parent popup visible.
	 * @param els Single element or array of elements to keep.
	 * @returns unkeep Stops keeping element, elements will hide after mouse leave, and will be hidden immediately if mouse is alread leaved.
	 */
	export function keep(els: Element | Element[]): () => void {

		// 1. When popup2 generated, we check the trigger element if it was contained (not equal) in elements of existing popups.
		// 2. If so, we lock the exist popup until popup2 disappeared.

		let elArray = Array.isArray(els) ? els : [els]

		let controller = getControllerWhichContains(elArray)
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

	/** Keep parent elements visible. */
	function keepParents(els: Element[]) {
		let parents = els.map(el => el.parentElement).filter(el => el && el !== document.body) as Element[]
		return keep(parents)
	}
	
	
	/** Get Controller whose related elements contains and or equal one of specified elements. */
	function getControllerWhichContains(els: Element[]): MouseLeaveController | null {
		for (let controller of [...Controllers].reverse()) {
			for (let el of els) {
				if (controller.els.some(controllerEl => controllerEl.contains(el))) {
					return controller
				}
			}
		}

		return null
	}
	
	
	/**
	 * Check if element or any of it's ancestors was kept to be visible.
	 * If element is not kept, you can destroy or reuse it immediately.
	 * It also allows `el` equals to controller element.
	 * @param el Element to check.
	 */
	export function inUse(el: Element): boolean {
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
	 * @param els Single element or element array to capture leaves at.
	 * @param callback The callback to call after mouse leaves all the elements.
	 * @param options Leave control options.
	 */
	export function on(els: Element | Element[], callback: () => void, options?: MouseLeaveOptions): () => void {
		let elArray = Array.isArray(els) ? els : [els]
		let controller = new MouseLeaveController(false, elArray, callback, options)

		return () => controller.cancel()
	}
	
	
	/**
	 * Call `callback` after mouse leaves all of the elements for `ms` milliseconds, only trigger `callback` for once.
	 * It's very usefull to handle mouse event in menu & submenu.
	 * @param els els Single element or element array to capture leaves at.
	 * @param callback The callback to call after mouse leaves all the elements.
	 * @param options Leave control options.
	 */
	export function once(els: Element | Element[], callback: () => void, options?: MouseLeaveOptions): () => void {
		let elArray = Array.isArray(els) ? els : [els]
		let controller = new MouseLeaveController(true, elArray, callback, options)

		return () => controller.cancel()
	}
	
	
	class MouseLeaveController {
		
		/** Related elements. */
		els: Element[]

		/** Is mouse inside any of `els`. */
		mouseIn: boolean
		
		/** 
		 * Count of been locked.
		 * 
		 * Why not a boolean property?
		 * When a sub popup hide, it will trigger unlock on controller later, not immediately.
		 * But a new sub popup may trigger lock on controller, and then old sub popup trigger unlock.
		 * `old lock -> new lock -> old unlock`, cause controller to be canceled.
		 */
		private lockCount: number = 0
		
		/** Is registered from `once`. */
		private isOnce: boolean

		/** `callback` after mouse leaves all of `els`. */
		private callback: () => void

		/** Trigger `callback` delay. */
		private delay: number

		/** Is the controller canceld. */
		private ended: boolean = false

		/** Timeout to countdown time delay for calling `callback` */
		private timeout: ReturnType<typeof setTimeout> | null = null

		/** Cancel keeping parents of `els` visible. */
		private unkeep: () => void
	
		constructor(isOnce: boolean, els: Element[], callback: () => void, options: MouseLeaveOptions = {}) {
			this.isOnce = isOnce
			this.els = els
			this.callback = callback
			
			this.delay = options.delay ?? 200
			this.mouseIn = options.mouseIn ?? false
	
			this.onMouseEnter = this.onMouseEnter.bind(this)
			this.onMouseLeave = this.onMouseLeave.bind(this)
			
			for (let el of this.els) {
				el.addEventListener('mouseenter', this.onMouseEnter, false)
				el.addEventListener('mouseleave', this.onMouseLeave, false)
			}
	
			this.unkeep = keepParents(els)
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
			this.timeout = setTimeout(() => this.onTimeout(), this.delay)
		}

		private onTimeout() {
			this.timeout = null
	
			if (!this.mouseIn) {
				this.flush()
			}
		}
	
		private clearTimeout() {
			if (this.timeout) {
				clearTimeout(this.timeout)
				this.timeout = null
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
