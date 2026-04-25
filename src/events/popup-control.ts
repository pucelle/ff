import {DOMEvents} from 'lupos'
import {Timeout} from '../tools'
import * as PopupStacker from './popup-stacker'


/** Options for popup control. */
export interface PopupControlOptions {

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


/**
 * Calls `callback` after mouse leaves both elements
 * and all the popped-up contents for `ms` milliseconds.
 * It's useful to manage mouse leave event for menu & submenus.
 * Returns a cancel callback.
 */
export function on(trigger: Element, popup: Element, callback: () => void, options?: PopupControlOptions): () => void {
	let controller = new PopupController(trigger, popup, callback, options)
	return () => controller.cancel()
}


/**
 * Calls `callback` for only once after mouse leaves both elements,
 * and all the popped-up contents for `ms` milliseconds.
 * It's useful to manage mouse leave event for menu & submenus.
 * Returns a cancel callback.
 */
export function once(trigger: Element, popup: Element, callback: () => void, options?: PopupControlOptions): () => void {
	function wrappedCallback() {
		cancel()
		callback()
	}

	let cancel = on(trigger, popup, wrappedCallback, options)

	return cancel
}



/** Manages a `trigger -> popup` pair. */
class PopupController {

	/** Whether mouse on popup trigger oe content. */
	private mouseOn: boolean = false
		
	/** Trigger element. */
	readonly trigger: Element

	/** Popup element. */
	readonly content: Element

	/** `callback` after mouse leaves all of `els`. */
	private callback: () => void

	/** Timeout to countdown time delay for calling `callback` */
	private timeout: Timeout

	constructor(trigger: Element, content: Element, callback: () => void, options: PopupControlOptions = {}) {
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
		this.mouseOn = true
		PopupStacker.onEnter(this.trigger, this.content)
	}

	private onMouseEnter() {
		this.mouseOn = true
		this.timeout.cancel()
		PopupStacker.onEnter(this.trigger, this.content)
	}

	private onMouseLeave() {
		this.mouseOn = false
		this.timeout.reset()
		PopupStacker.onLeave(this.trigger)
	}

	private onDOMMouseMove(e: MouseEvent) {

		if (!this.mouseOn || !e.target) {
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
		if (PopupStacker.hasLocked(this.content)) {
			PopupStacker.listenDestroy(this.trigger, this.onDeliveryReleased.bind(this))
		}
		else {
			this.finish()
		}
	}

	/** After released delivering lock. */
	private onDeliveryReleased() {
		if (!this.mouseOn) {
			this.finish()
		}
	}

	/** Finish leave by calling leave callback. */
	finish() {
		PopupStacker.destroy(this.trigger)
		this.callback()
	}

	cancel() {
		this.timeout.cancel()

		for (let el of [this.trigger, this.content]) {
			DOMEvents.off(el, 'mouseenter', this.onMouseEnter, this)
			DOMEvents.off(el, 'mouseleave', this.onMouseLeave, this)
		}

		DOMEvents.off(document, 'mousemove', this.onDOMMouseMove, this)
		PopupStacker.destroy(this.trigger)
	}
}
