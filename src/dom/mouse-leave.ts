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

	/** Existed mouse leave controllers. */
	const Controllers: Set<MouseLeaveController> = new Set()

	/**
	 * Make sure `trigger` and all their ancestors can't call mouse leave callback and always visible.
	 * Normally used for contextmenu to keep parent popup visible.
	 * @param els Single element or array of elements to keep.
	 * @returns unkeep Stops keeping element, elements will hide after mouse leave, and will be hidden immediately if mouse is alread leaved.
	 */
	export function lock(trigger: Element): () => void {

		// 1. When popup2 generated, we check the trigger element if it was contained (not equal) in elements of existing popups.
		// 2. If so, we lock the exist popup until popup2 disappeared.

		let controller = getControllerWhichPopupContains(trigger)
		if (controller) {
			controller.lockBy(trigger)
		}
	
		return () => {
			if (controller) {
				controller.unlockBy(trigger)
				controller = null
			}
		}
	}

	
	/** Get Controller whose related elements contains and or equal one of specified elements. */
	function getControllerWhichPopupContains(trigger: Element): MouseLeaveController | null {
		for (let controller of [...Controllers].reverse()) {
			if (controller.popup.contains(trigger)) {
				return controller
			}
		}

		return null
	}
	
	
	/**
	 * Check whether element or any of it's ancestors was kept to be visible.
	 * If element is not locked, you can destroy or reuse it immediately.
	 * @param el Element to check, normally a popup element.
	 */
	export function beLocked(el: Element): boolean {
		for (let controller of [...Controllers].reverse()) {
			if (controller.popup.contains(el)) {
				return controller.beLocked()
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
	export function on(trigger: Element, popup: Element, callback: () => void, options?: MouseLeaveOptions): () => void {
		let controller = new MouseLeaveController(trigger, popup, false, callback, options)
		return () => controller.cancel()
	}
	
	
	/**
	 * Call `callback` after mouse leaves all of the elements for `ms` milliseconds, only trigger `callback` for once.
	 * It's very usefull to handle mouse event in menu & submenu.
	 * @param els els Single element or element array to capture leaves at.
	 * @param callback The callback to call after mouse leaves all the elements.
	 * @param options Leave control options.
	 */
	export function once(trigger: Element, popup: Element, callback: () => void, options?: MouseLeaveOptions): () => void {
		let controller = new MouseLeaveController(trigger, popup, true, callback, options)

		return () => controller.cancel()
	}
	
	
	class MouseLeaveController {
		
		/** Trigger elements. */
		trigger: Element

		/** Popup elements. */
		popup: Element

		/** Is mouse inside any of `els`. */
		private mouseIn: boolean
		
		/** Elements that locked current popup and make it to be visible. */
		private lockedBy: Set<Element> = new Set()
		
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

		/** Cancel locking trigger element. */
		private unlock: () => void
	
		constructor(trigger: Element, popup: Element, isOnce: boolean, callback: () => void, options: MouseLeaveOptions = {}) {
			this.trigger = trigger
			this.popup = popup
			this.isOnce = isOnce
			this.callback = callback
			
			this.delay = options.delay ?? 200
			this.mouseIn = options.mouseIn ?? false
	
			this.onMouseEnter = this.onMouseEnter.bind(this)
			this.onMouseLeave = this.onMouseLeave.bind(this)
			
			for (let el of [trigger, popup]) {
				el.addEventListener('mouseenter', this.onMouseEnter, false)
				el.addEventListener('mouseleave', this.onMouseLeave, false)
			}
	
			this.unlock = lock(trigger)
			Controllers.add(this)
		}
	
		private onMouseEnter() {
			this.mouseIn = true
			this.clearTimeout()
		}
	
		private onMouseLeave() {
			this.mouseIn = false
	
			if (!this.beLocked()) {
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
	
			for (let el of [this.trigger, this.popup]) {
				el.removeEventListener('mouseenter', this.onMouseEnter, false)
				el.removeEventListener('mouseleave', this.onMouseLeave, false)
			}
	
			this.unlock()
			this.ended = true
			Controllers.delete(this)
		}

		beLocked() {
			return this.lockedBy.size > 0
		}
	
		lockBy(el: Element) {
			this.clearTimeout()
			this.lockedBy.add(el)
		}
	
		unlockBy(el: Element) {
			this.lockedBy.delete(el)
	
			if (!this.beLocked()) {
				if (!this.mouseIn) {
					this.flush()
				}
			}
		}
	}
}
