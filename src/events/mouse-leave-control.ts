import {DOMEvents} from '@pucelle/lupos'
import {TwoWayMap} from '../structs'
import {Timeout} from '../tools'


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
	 * E.g., when need to show popup immediately, only need to hide popup after mouse leave.
	 */
	mouseIn?: boolean
}


/*
 * Assume you are programming a menu and submenu component,
 * When mouse over a menu and open a submenu, previous menu should be kept visible,
 * And after mouse leaves submenu, should hide both menu and submenu.
 * 
 * Example:
 * 	- `trigger1` cause `popup1` get popped-up, creates `controller1`.
 * 	- `trigger2` is contained by `popup1`, and cause `popup2` get popped-up, creates `controller2`.
 *  - `trigger3` is contained by `popup2`, and cause `popup3` get popped-up, creates `controller3`.
 *
 * So:
 * 	- `trigger1` cause `popup1` popped-up, `lockBy(trigger1)`, nothing happens.
 *  - Mouse leave `trigger1`, nothing happens.
 * 
 *  - `trigger2` cause `popup2` popped-up, `lockBy(trigger2)`, create lock: `controller1 <=> trigger2`.
 *  - Mouse leave `trigger2`, release lock `controller1 <=> trigger2`.
 * 
 *  - `trigger3` cause `popup3` popped-up, `lockBy(trigger3)`, create locks: `controller2 <=> trigger3` and `controller1 <=> trigger2`.
 *  - Mouse leave `trigger2`, release locks `controller2 <=> trigger3` and `controller1 <=> trigger2`.
 */


/** All controllers that begin to enter and not fully leave. */
const LiveControllers: Set<MouseLeaveController> = new Set()

/** All locked controllers, and the mapped trigger elements that lock them. */
const Locks: TwoWayMap<MouseLeaveController, Element> = new TwoWayMap()

/** Timeout counter to check and delete disconnected elements. */
const clearDisconnectedTimeout = new Timeout(clearDisconnectedOnIdle, 3000)

/** After idle, clear disconnected elements, and their locked controllers. */
async function clearDisconnectedOnIdle() {
	requestIdleCallback(clearDisconnected)
}

/** Clear all disconnected elements and their locked controllers. */
function clearDisconnected() {
	for (let [controller, element] of Locks.entries()) {

		// Element may be removed unexpectedly, which cause locks cant be removed.
		if (document.contains(element)) {
			continue
		}

		Locks.deleteRight(element)

		// `controller` has no lock associated now, finish it.
		controller.finish()
	}

	// Continue to clear later if still has locks existed.
	if (Locks.leftKeyCount() > 0) {
		clearDisconnectedTimeout.reset()
	}
}


/** 
 * Lock by a trigger element, make sure related mouse-leave controllers
 * not trigger leave action to make it can't be hidden.
 */
export function lock(trigger: Element) {
	let lockChanged = false

	for (let controller of walkControllerChainContains(trigger)) {
		Locks.setUnRepeatably(controller, trigger)
		lockChanged = true
	}

	if (lockChanged) {
		clearDisconnectedTimeout.reset()
	}
}


/** Walk controller chain which's popup element containers trigger. */
function* walkControllerChainContains(trigger: Element): Iterable<MouseLeaveController> {
	let controllers = [...LiveControllers.values()]

	for (let c of controllers) {
		if (c.popup.contains(trigger)) {
			yield c
		}
	}
}


/** 
 * Release the locks of mouse-leave controllers related with a trigger element,
 * make these controllers can trigger leave action, and trigger immediately if should.
 * And specified trigger element can be hidden now.
 */
export function unlock(trigger: Element) {
	for (let controller of walkLockChain(trigger)) {
		controller.onLockReleased()
		Locks.deleteLeft(controller)
	}
}


function* walkLockChain(trigger: Element): Iterable<MouseLeaveController> {
	while (true) {
		let controller = Locks.getByRight(trigger)
		if (!controller) {
			break
		}

		yield controller

		// Unlock next in sequence.
		trigger = controller.trigger
	}
}


/**
 * Checks whether element or any of it's ancestral elements are inside a popup of any locked controller.
 * If it hasn't been locked, you can destroy or reuse it immediately.
 */
export function checkLocked(el: Element): boolean {
	for (let controller of Locks.leftKeys()) {
		if (controller.popup.contains(el)) {
			return true
		}
	}

	return false
}


/**
 * Calls `callback` after mouse leaves both elements
 * and all the popped-up contents for `ms` milliseconds.
 * It's useful to manage mouse leave event for menu & submenus.
 * Returns a cancel callback.
 */
export function on(trigger: Element, popup: Element, callback: () => void, options?: MouseLeaveControlOptions): () => void {
	let controller = new MouseLeaveController(trigger, popup, callback, options)
	return () => controller.cancel()
}


/**
 * Calls `callback` for only once after mouse leaves both elements,
 * and all the popped-up contents for `ms` milliseconds.
 * It's useful to manage mouse leave event for menu & submenus.
 * Returns a cancel callback.
 */
export function once(trigger: Element, popup: Element, callback: () => void, options?: MouseLeaveControlOptions): () => void {
	function wrappedCallback() {
		cancel()
		callback()
	}

	let cancel = on(trigger, popup, wrappedCallback, options)

	return cancel
}



/** Manages a `trigger -> popup` pair. */
class MouseLeaveController {

	/** Whether mouse in. */
	private entered: boolean = false
		
	/** Trigger element. */
	readonly trigger: Element

	/** Popup element. */
	readonly popup: Element

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
	}

	private onMouseEnter() {
		if (this.entered) {
			return
		}

		this.entered = true

		// Lock by current trigger element.
		lock(this.trigger)

		LiveControllers.add(this)
		this.timeout.cancel()
	}

	private onMouseLeave() {
		if (!this.entered) {
			return
		}

		this.entered = false

		// Not been locked.
		if (!Locks.hasLeft(this)) {
			this.timeout.reset()
		}
	}

	private onTimeout() {

		// May locks get changed, so should validate again.
		if (!Locks.hasLeft(this)) {
			this.finish()
		}
	}

	/** After released locks. */
	onLockReleased() {
		if (!this.entered) {
			this.timeout.reset()
		}
	}

	/** Finish leave by calling leave callback. */
	finish() {
		this.callback()
		
		unlock(this.trigger)
		LiveControllers.delete(this)
	}

	cancel() {
		this.timeout.cancel()

		for (let el of [this.trigger, this.popup]) {
			DOMEvents.off(el, 'mouseenter', this.onMouseEnter, this)
			DOMEvents.off(el, 'mouseleave', this.onMouseLeave, this)
		}

		unlock(this.trigger)
		LiveControllers.delete(this)
	}
}
