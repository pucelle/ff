import {DOMEvents} from './dom-events'
import {TwoWaySetMap} from '../structs'
import {Timeout} from '../utils'


/*
Assume:
	`trigger1` cause `popup1` get popped-up.
	`trigger2` is contained by `popup1`, and cause `popup2` get poped-up.
	Mouse leaves `popup1`, enter `popup2`, `popup1` must not be closed.
*/


/** Options for mouse leave control. */
export interface MouseLeaveControlOptions {

	/** 
	 * If mouse leaves all the elements and doesn't enter again during a duration
	 * which is specified by this `delay` milliseconds, then calls callback.
	 * Default value is `200`.
	 */
	delay?: number

	/** 
	 * When already knows that mouse is inside any of current elements, set this to `true`.
	 * E.g., show popup immediately, only need to hide popup after capturing mouse leave.
	 */
	mouseIn?: boolean
}


/**
 * It's common that popup2 was triggered from pointing to a button at an existing popup1,
 * later when mouse moved to popup2, popup1 should also be kept to be visible.
 */
export namespace MouseLeaveControl {

	/** Existing mouse leave controllers. */
	const Controllers: Set<MouseLeaveController> = new Set()

	/** Locks betweens controllers and elements. */
	const Locks: TwoWaySetMap<MouseLeaveController, Element> = new TwoWaySetMap()


	/** Lock an element, makesure it can't be hidden before been unlocked. */
	export function lock(el: Element) {
		for (let controller of Controllers.values()) {
			if (controller.isPopupContains(el)) {
				Locks.add(controller, el)
				clearDisconnectedTimeout.reset()
			}
		}
	}


	/** Release the lock of specified element, which can be hidden now. */
	export function unlock(el: Element) {
		for (let controller of Controllers.values()) {
			if (Locks.has(controller, el)) {
				Locks.delete(controller, el)

				// No lock existed, should finish leave.
				if (!Locks.hasLeft(controller)) {
					controller.finishLeave()
				}
			}
		}
	}


	/**
	 * Checks whether element or any of it's ancestors was locked and kept to be visible.
	 * If it's not locked, you can destroy or reuse it immediately.
	 */
	export function checkLocked(el: Element): boolean {
		return Locks.hasRight(el)
	}

	
	/**
	 * Calls `callback` after mouse leaves both elements,
	 * and all the poped-up contents for `ms` milliseconds.
	 * It's usefull to manage mouse leave event of menu & submenus.
	 * Returns a cancel callback.
	 */
	export function on(trigger: Element, popup: Element, callback: () => void, options?: MouseLeaveControlOptions): () => void {
		let controller = new MouseLeaveController(trigger, popup, callback, options)
		return () => controller.cancel()
	}
	
	
	/**
	 * Calls `callback` for only once after mouse leaves both elements,
	 * and all the poped-up contents for `ms` milliseconds.
	 * It's usefull to manage mouse leave event of menu & submenus.
	 * Returns a cancel callback.
	 */
	export function once(trigger: Element, popup: Element, callback: () => void, options?: MouseLeaveControlOptions): () => void {
		let wrappedCallback = () => {
			cancel()
			callback()
		}

		let cancel = on(trigger, popup, wrappedCallback, options)

		return cancel
	}


	/** Timeout counter to check and delete disconnected elements. */
	const clearDisconnectedTimeout = new Timeout(clearDisconnectedInIdle, 60000)

	async function clearDisconnectedInIdle() {
		requestIdleCallback(clearDisconnected)
	}

	/** Clear all disconnected elements and empty controllers. */
	function clearDisconnected() {
		for (let [element, controllers] of Locks.rightEntries()) {
			if (element.ownerDocument) {
				continue
			}

			// `controllers` is not reset after deleting by element.
			Locks.deleteRight(element)

			for (let controller of controllers) {
				if (!Locks.hasLeft(controller)) {
					controller.finishLeave()
				}
			}
		}

		// Continue to clear if still has locks existed.
		if (Locks.leftKeyCount() > 0) {
			clearDisconnectedTimeout.reset()
		}
	}

	
	/** Manages a `trigger -> popup` pair. */
	class MouseLeaveController {
			
		/** Trigger element. */
		private readonly trigger: Element

		/** Popup element. */
		private readonly popup: Element

		/** `callback` after mouse leaves all of `els`. */
		private callback: () => void

		/** Timeout to countdown time delay for calling `callback` */
		private timeout: Timeout

		constructor(trigger: Element, popup: Element, callback: () => void, options: MouseLeaveControlOptions = {}) {
			this.trigger = trigger
			this.popup = popup
			this.callback = callback

			let delay = options.delay ?? 200
			this.timeout = new Timeout(this.onTimeout.bind(this), delay)
					
			if (options.mouseIn) {
				this.onMouseEnter()
			}

			for (let el of [trigger, popup]) {
				DOMEvents.on(el, 'mouseenter', this.onMouseEnter, this)
				DOMEvents.on(el, 'mouseleave', this.onMouseLeave, this)
			}

			Controllers.add(this)
		}

		/** Whether popup element constains specified element. */
		isPopupContains(el: Element): boolean {
			return this.popup.contains(el)
		}

		private onMouseEnter() {

			// Lock trigger.
			lock(this.trigger)

			// Add a lock to lock itself because of mouse in.
			Locks.add(this, this.popup)

			this.timeout.cancel()
		}

		private onMouseLeave() {

			// Unlock itself.
			Locks.delete(this, this.popup)

			// Not locked by other elements.
			if (!Locks.hasLeft(this)) {
				this.timeout.reset()
			}
		}

		private onTimeout() {

			// May locks get changed, so should validate again.
			if (!Locks.hasLeft(this)) {
				this.finishLeave()
			}
		}

		/** Finish leave by calling leave callback. */
		finishLeave() {
			this.callback()
		}

		cancel() {
			this.timeout.cancel()

			for (let el of [this.trigger, this.popup]) {
				DOMEvents.off(el, 'mouseenter', this.onMouseEnter, this)
				DOMEvents.off(el, 'mouseleave', this.onMouseLeave, this)
			}

			this.releaseLocks()
			Controllers.delete(this)
		}
		
		/** Release all locks that binded to current controller. */
		private releaseLocks() {
			Locks.deleteLeft(this)
			unlock(this.trigger)
		}
	}
}
