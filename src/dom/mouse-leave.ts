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

	/** Add one controller. */
	export function addController(controller: MouseLeaveController) {
		Controllers.add(controller)
	}

	/** Delete one controller. */
	export function deleteController(controller: MouseLeaveController) {
		Controllers.delete(controller)
	}

	/**
	 * Make sure `trigger` and all their ancestors can't call mouse leave callback and always visible.
	 * Normally used for contextmenu to keep parent popup visible.
	 * @param trigger Element to keep visible.
	 * @param popup Popup element that lock trigger element for preview. You should always provide this except there is no popup element.
	 */
	export function lock(trigger: Element, popup: Element | null = null) {

		// 1. When popup2 generated, we check the trigger element if it was contained (not equal) in element of existing popups.
		// 2. If so, we lock the exist popup until popup2 disappeared.

		let controller = getControllerWhichPopupContains(trigger)
		if (controller) {
			controller.requestLock(trigger, popup)
		}
	}


	/**
	 * Release locking `trigger` element.
	 * @param trigger Element don't want to keep anymore.
	 * @param popup Popup element that lock trigger element for preview. You should always provide this except there is no popup element.
	 */
	export function unlock(trigger: Element, popup: Element | null = null) {
		let controller = getControllerWhichPopupContains(trigger)
		if (controller) {
			controller.releaseLock(trigger, popup)
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
	 * Checks whether element or any of it's ancestors was kept to be visible.
	 * If element is not locked, you can destroy or reuse it immediately.
	 * @param el Element to check, normally a popup element.
	 */
	export function checkLocked(el: Element): boolean {
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
}



class MouseLeaveController {
		
	/** Trigger elements. */
	trigger: Element

	/** Popup elements. */
	popup: Element

	/** Is mouse inside any of `els`. */
	private mouseIn: boolean = false
	
	/** Elements that locked current popup and make it to be visible. */
	private locks: Map<Element, Set<Element | null>> = new Map()
	
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

	private bindedOnMouseEnter: () => void
	private bindedOnMouseLeave: () => void

	constructor(trigger: Element, popup: Element, isOnce: boolean, callback: () => void, options: MouseLeaveOptions = {}) {
		this.trigger = trigger
		this.popup = popup
		this.isOnce = isOnce
		this.callback = callback
		this.delay = options.delay ?? 200
					
		if (options.mouseIn) {
			this.onMouseEnter()
		}

		this.bindedOnMouseEnter = this.onMouseEnter.bind(this)
		this.bindedOnMouseLeave = this.onMouseLeave.bind(this)

		for (let el of [trigger, popup]) {
			el.addEventListener('mouseenter', this.bindedOnMouseEnter, false)
			el.addEventListener('mouseleave', this.bindedOnMouseLeave, false)
		}

		MouseLeave.addController(this)
	}

	private onMouseEnter() {
		this.mouseIn = true
		MouseLeave.lock(this.trigger, this.popup)
		this.clearTimeout()
	}

	private onMouseLeave() {
		this.mouseIn = false
		MouseLeave.unlock(this.trigger, this.popup)

		if (!this.beLocked()) {
			this.startTimeout()
		}
	}

	private startTimeout() {
		this.clearTimeout()
		this.timeout = setTimeout(() => this.onTimeout(), this.delay)
	}

	private startTimeoutIfNot() {
		if (!this.timeout) {
			this.startTimeout()
		}
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
		else {
			this.releaseAllLocks()
		}

		this.callback()
	}

	cancel() {
		if (this.ended) {
			return
		}
		
		this.clearTimeout()

		for (let el of [this.trigger, this.popup]) {
			el.removeEventListener('mouseenter', this.bindedOnMouseEnter, false)
			el.removeEventListener('mouseleave', this.bindedOnMouseLeave, false)
		}

		MouseLeave.unlock(this.trigger, this.popup)
		this.releaseAllLocks()
		this.ended = true
		MouseLeave.deleteController(this)
	}

	/** Whether was locked to keep visible. */
	beLocked() {
		return this.locks.size > 0
	}
	
	/** Lock because want to keep `el` visible, request comes from `popup`. */
	requestLock(el: Element, popup: Element | null) {
		this.clearTimeout()

		let identifiers = this.locks.get(el)
		if (!identifiers) {
			identifiers = new Set()
			this.locks.set(el, identifiers)
		}
		identifiers.add(popup)

		// Mouse leave will cause unlock in sequence,
		// So after mouse in, must relock in sequence.
		MouseLeave.lock(this.trigger, popup)
	}

	/** Release a lock. */
	releaseLock(el: Element, popup: Element | null) {
		let identifiers = this.locks.get(el)
		if (identifiers) {
			identifiers.delete(popup)

			if (identifiers.size === 0) {
				this.locks.delete(el)
			}
		}

		MouseLeave.unlock(this.trigger, popup)

		// May already started timeout because of mouse leave.
		if (!this.beLocked() && !this.mouseIn) {
			MouseLeave.unlock(this.trigger, this.popup)
			this.startTimeoutIfNot()
		}
	}

	/** 
	 * Release all locks that from outside.
	 * This method is not required if everything goes well.
	 * But implement it will make it stronger.
	 */
	private releaseAllLocks() {
		for (let [el, popups] of this.locks) {
			for (let popup of popups) {
				MouseLeave.unlock(el, popup)
			}
		}

		this.locks = new Map()
	}
}