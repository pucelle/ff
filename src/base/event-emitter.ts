// At beginning, I implement a good Emitter by inferring listener arguments and emitting arguments.
// But then I meet a big problem when extending the class, described by:
// https://stackoverflow.com/questions/55813041/problems-on-typescript-event-interface-extends

// I'm trying to merge event listener interfaces but failed,
// Guess the main reason is when one of the the event listener interface is generic argument and not known yet,
// TS can't merge two event listener interfaces and infer types of listener arguments for one listener,
// The type of listener becomes `resolved Listener A & unresolved Listener B`, it's arguments can't be inferred.


/** Cache each registered event. */
interface EventItem {
	listener: any
	scope?: object
	once: boolean
}

/** Event handler. */
type EventHandler = (...args: any[]) => void


/** 
 * Event emitter as super class to listen and emit custom events.
 * @typeparam E Event interface in `{eventName: (...args) => void}` format.
 */
export class EventEmitter<E = any> {

	/** Registered events. */
	private __events: Map<keyof E, EventItem[]> = new Map()

	/** Ensure event cache items to cache item. */
	private __ensureEvents<K extends keyof E>(name: K): EventItem[] {
		let events = this.__events.get(name)
		if (!events) {
			this.__events.set(name, events = [])
		}

		return events
	}

	/**
	 * Registers an event `listener` to listen event with specified `name`.
	 * @param name The event name.
	 * @param listener The event listener.
	 * @param scope The scope will be binded to listener.
	 */
	on<K extends keyof E>(name: K, listener: EventHandler, scope?: object) {
		let events = this.__ensureEvents(name)
		
		events.push({
			listener,
			scope,
			once: false,
		})
	}

	/**
	 * Registers an event `listener` to listen event with specified `name`, triggers for only once.
	 * @param name The event name.
	 * @param listener The event listener.
	 * @param scope The scope will be binded to listener.
	 */
	once<K extends keyof E>(name: K, listener: EventHandler, scope?: object) {
		let events = this.__ensureEvents(name)

		events.push({
			listener,
			scope,
			once: true
		})
	}

	/**
	 * Removes the `listener` that is listening specified event `name`.
	 * @param name The event name.
	 * @param listener The event listener, only matched listener will be removed.
	 * @param scope The scope binded to listener. If provided, remove listener only when scope match.
	 */
	off<K extends keyof E>(name: K, listener: EventHandler, scope?: object) {
		let events = this.__events.get(name)
		if (events) {
			for (let i = events.length - 1; i >= 0; i--) {
				let event = events[i]
				if (event.listener === listener && (!scope || event.scope === scope)) {
					events.splice(i, 1)
				}
			}
		}
	}

	/**
	 * Check whether `listener` is in the list for listening specified event `name`.
	 * @param name The event name.
	 * @param listener The event listener to check.
	 * @param scope The scope binded to listener. If provided, will additionally check whether the scope match.
	 */
	hasListener(name: string, listener: Function, scope?: object) {
		let events = this.__events.get(name as any)
		if (events) {
			for (let i = 0, len = events.length; i < len; i++) {
				let event = events[i]

				if (event.listener === listener && (!scope || event.scope === scope)) {
					return true
				}
			}
		}

		return false
	}

	/**
	 * Check whether any `listener` is listening specified event `name`.
	 * @param name The event name.
	 */
	hasListeners(name: string) {
		let events = this.__events.get(name as any)
		return !!events && events.length > 0
	}

	/**
	 * Emit specified event with event `name` and arguments.
	 * @param name The event name.
	 * @param args The arguments that will be passed to event listeners.
	 */
	emit<K extends keyof E>(name: K, ...args: any[]) {
		let events = this.__events.get(name)
		if (events) {
			for (let i = 0; i < events.length; i++) {
				let event = events[i]

				// The listener may call off, so must remove it before handling
				if (event.once === true) {
					events.splice(i--, 1)
				}

				event.listener.apply(event.scope, args)
			}
		}
	}

	/** Removes all the event listeners. */
	removeAllListeners() {
		this.__events = new Map()
	}
}
