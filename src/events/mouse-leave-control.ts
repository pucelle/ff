import {DOMEvents} from 'lupos'
import {Timeout} from '../tools'
import * as MouseEventDelivery from './mouse-event-delivery'


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
	readonly content: Element

	/** `callback` after mouse leaves all of `els`. */
	private callback: () => void

	/** Timeout to countdown time delay for calling `callback` */
	private timeout: Timeout

	constructor(trigger: Element, content: Element, callback: () => void, options: MouseLeaveControlOptions = {}) {
		this.trigger = trigger
		this.content = content
		this.callback = callback

		let delay = options.delay ?? 200
		this.timeout = new Timeout(this.onTimeout.bind(this), delay)

		if (options.mouseIn) {
			this.onMouseAlreadyIn()
		}

		for (let el of [trigger, content]) {
			DOMEvents.on(el, 'mouseenter', this.onMouseEnter, this)
			DOMEvents.on(el, 'mouseleave', this.onMouseLeave, this)
		}

		// `mouseleave` is not trustable when element moves out of cursor.
		DOMEvents.on(document, 'mousemove', this.onDOMMouseMove, this)
	}

	private onMouseAlreadyIn() {
		this.entered = true
		MouseEventDelivery.attach(this.trigger, this.content)
	}

	private onMouseEnter() {
		this.entered = true
		this.timeout.cancel()
		MouseEventDelivery.attach(this.trigger, this.content)
	}

	private onMouseLeave() {
		this.entered = false
		this.timeout.reset()
		MouseEventDelivery.halfDetach(this.trigger)
	}

	private onDOMMouseMove(e: MouseEvent) {

		if (!this.entered || !e.target) {
			return
		}

		// Triggers mouse leave.
		let target = e.target as Element
		if (!this.trigger.contains(target) && !this.content.contains(target)) {
			this.onMouseLeave()
		}
	}

	private onTimeout() {

		// Can't hide if event delivery still attaching at.
		if (MouseEventDelivery.hasAnyDeliveredTo(this.content)) {
			MouseEventDelivery.listenDetaching(this.trigger, this.onDeliveryReleased.bind(this))
		}
		else {
			this.finish()
		}
	}

	/** After released delivering lock. */
	private onDeliveryReleased() {
		if (!this.entered) {
			this.finish()
		}
	}

	/** Finish leave by calling leave callback. */
	finish() {
		MouseEventDelivery.detach(this.trigger)
		this.callback()
	}

	cancel() {
		this.timeout.cancel()

		for (let el of [this.trigger, this.content]) {
			DOMEvents.off(el, 'mouseenter', this.onMouseEnter, this)
			DOMEvents.off(el, 'mouseleave', this.onMouseLeave, this)
		}

		DOMEvents.off(document, 'mousemove', this.onDOMMouseMove, this)
		MouseEventDelivery.detach(this.trigger)
	}
}
