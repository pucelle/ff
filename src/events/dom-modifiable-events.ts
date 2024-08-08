import * as DOMEvents from './dom-events'


/** Event handler. */
type EventHandler = (e: Event) => void

/** All event modifiers organized by event type. */
type EventModifiers = {
	keydown: typeof ControlKeyModifiers | typeof GlobalEventModifiers
	keyup: typeof ControlKeyModifiers | typeof GlobalEventModifiers
	keypress: typeof ControlKeyModifiers | typeof GlobalEventModifiers

	mousedown: MouseEventModifiers
	mousemove: MouseEventModifiers
	mouseup: MouseEventModifiers
	mouseout: MouseEventModifiers
	mouseenter: MouseEventModifiers
	mouseleave: MouseEventModifiers
	
	pointerover: MouseEventModifiers
	pointerenter: MouseEventModifiers
	pointerdown: MouseEventModifiers
	pointermove: MouseEventModifiers
	pointerup: MouseEventModifiers
	pointercancel: MouseEventModifiers
	pointerout: MouseEventModifiers
	pointerleave: MouseEventModifiers
	pointerrawupdate: MouseEventModifiers
	gotpointercapture: MouseEventModifiers
	lostpointercapture: MouseEventModifiers

	click: typeof ControlKeyModifiers | keyof typeof ButtonNameModifiers | typeof GlobalEventModifiers
	dblclick: typeof ControlKeyModifiers | keyof typeof ButtonNameModifiers | typeof GlobalEventModifiers
	change: typeof ControlKeyModifiers | typeof ChangeEventModifiers | typeof GlobalEventModifiers
	wheel: typeof ControlKeyModifiers | typeof WheelEventModifiers | typeof GlobalEventModifiers
}

type MouseEventModifiers = typeof ControlKeyModifiers | keyof typeof ButtonNameModifiers | typeof GlobalEventModifiers

/** Get event modifiers by event type. */
type EventModifiersByType<T extends string> = T extends keyof EventModifiers ? EventModifiers[T][] : typeof GlobalEventModifiers


/** Modifiers to filter events by event actions. */
const GlobalEventModifiers = ['capture', 'self', 'once', 'prevent', 'stop', 'passive'] as const

/** Modifiers to filter key events. */
const ControlKeyModifiers = ['ctrl', 'shift', 'alt'] as const

/** Modifiers to filter change events. */
const ChangeEventModifiers = ['check', 'uncheck'] as const

/** Modifiers to filter wheel events. */
const WheelEventModifiers = ['up', 'down'] as const

/** Modifiers to filter click events. */
const ButtonNameModifiers = {
	left: 0,
	middle: 1,
	right: 2,
	main: 0,
	auxiliary: 1,
	secondary: 2,
}


/** Filter key event by event key. */
function keyEventFilter(e: KeyboardEvent, modifiers: string[]): boolean {
	// Full key list: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
	// Capture key at: https://keycode.info/

	let codeModifiers: string[] = []

	// Control keys must match.
	for (let modifier of modifiers) {
		if (ControlKeyModifiers.includes(modifier as any)) {
			if (!isControlKeyMatchModifier(e, modifier)) {
				return false
			}
			continue
		}
		
		codeModifiers.push(modifier)
	}

	return codeModifiers.length === 0
		|| codeModifiers.includes(e.code.toLowerCase())
		|| codeModifiers.includes(e.key.toLowerCase())
}

/** Filter mouse event by mouse button. */
function mouseEventFilter(e: MouseEvent, modifiers: string[]): boolean {
	let buttonModifiers: string[] = []

	// Control keys must match.
	for (let modifier of modifiers) {
		if (ControlKeyModifiers.includes(modifier as any)) {
			if (!isControlKeyMatchModifier(e, modifier)) {
				return false
			}
			continue
		}
		
		buttonModifiers.push(modifier)
	}

	if (buttonModifiers.length === 0) {
		return true
	}

	if (buttonModifiers.find(f => ButtonNameModifiers[f as keyof typeof ButtonNameModifiers] === e.button)) {
		return true
	}

	return false
}

/** Filter key event by control keys. */
function isControlKeyMatchModifier(e: KeyboardEvent | MouseEvent, modifier: string): boolean {
	if (modifier === 'ctrl' && (!e.ctrlKey && !e.metaKey)
		|| modifier === 'shift' && !e.shiftKey
		|| modifier === 'alt' && !e.altKey
	) {
		return false
	}

	return true
}

/** Filter change event by checkbox checked state. */
function changeEventFilter(e: Event, [modifier]: string[]) {
	let checked = (e.target as HTMLInputElement).checked

	return checked && modifier === 'check'
		|| checked && modifier === 'uncheck'
}

/** Filter wheel event by wheel delta value. */
function wheelEventFilter(e: WheelEvent, [modifier]: string[]) {
	return (e.deltaY < 0) && modifier === 'up'
		|| (e.deltaY > 0) && modifier === 'down'
}

/** Event filters to limit by event type. */
const EventFilters = {
	keydown: keyEventFilter,
	keyup: keyEventFilter,
	keypress: keyEventFilter,
	mousedown: mouseEventFilter,
	mousemove: mouseEventFilter,
	mouseup: mouseEventFilter,
	click: mouseEventFilter,
	dblclick: mouseEventFilter,
	change: changeEventFilter,
	wheel: wheelEventFilter,
}


/**
 * Register an event listener on an element.
 * - `modifiers`: can specify some modifier to limit event handler only be called when modifiers match.
 * 
 * Returns a callback to unbind.
 */
export function on<T extends string>(
	el: EventTarget,
	type: T,
	modifiers: EventModifiersByType<T> | null,
	handler: EventHandler,
	scope?: object
): () => void {
	if (scope) {
		handler = handler.bind(scope)
	}

	let wrappedHandler = wrapHandler(el, type, modifiers as string[] | null, handler)
	let capture = !!modifiers && (modifiers as string[]).includes('capture')
	let passive = !!modifiers && (modifiers as string[]).includes('passive')

	// Wheel event use passive mode by default and can't be prevented.
	let options = passive || type === 'wheel' ? {capture, passive} : {capture}

	DOMEvents.on(el, type, wrappedHandler, null, options)
	
	return function() {
		DOMEvents.off(el, type, wrappedHandler)
	}
}


/** Wrap handler to filter by modifiers. */
function wrapHandler(el: EventTarget, type: string, modifiers: string[] | null, handler: EventHandler): EventHandler {
	let filterModifiers = modifiers?.filter(m => !GlobalEventModifiers.includes(m as any))

	return function wrappedHandler(e: Event) {
		if (filterModifiers && filterModifiers.length > 0) {
			let filterFn = EventFilters[type as keyof typeof EventFilters]
			if (!filterFn(e as any, filterModifiers)) {
				return
			}
		}

		if (modifiers && modifiers.includes('self') && e.target !== el) {
			return
		}

		if (modifiers && modifiers.includes('prevent')) {
			e.preventDefault()
		}

		if (modifiers && modifiers.includes('stop')) {
			e.stopPropagation()
		}

		if (modifiers && modifiers.includes('once')) {
			DOMEvents.off(el, type, wrappedHandler)
		}

		handler(e)
	}
}
