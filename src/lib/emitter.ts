// At beginning, we implement a good Emitter by inferring listener arguments and emitting arguments.
// But then we meet a big problem when extending the class, described by:
// https://stackoverflow.com/questions/55813041/problems-on-typescript-event-interface-extends
// We are trying to merge event listener interfaces but failed,
// Guess the main reason is when one of the the event listener interface is generic argument,
// we can't merge two event listener interfaces and infer types of listener arguments for one listener,
// The type of listener becomes `resolved Listener A & unresolved Listener B`, arguments of it can't be inferred.

// Solution in https://stackoverflow.com/questions/55763701/extensible-strongly-typed-event-emitter-interface-in-typescript/55789081
// doesn't help much, because `Pick<>` will transfer class methods to class members, and have conflict when overwriting the methods.


type KeyOf<T> = keyof T & string

type EventListener = (...args: any[]) => void

interface EventItem {
	listener: EventListener
	scope?: object,
	once: boolean
}


/** An event emitter to listen and emit events. */
export class Emitter<Events = any, K extends KeyOf<Events> = KeyOf<Events>> {

	private __events: {[key: string]: EventItem[]} = {}

	/**
	 * Register listener for specified event name.
	 * @param name The event name.
	 * @param listener The event listener.
	 * @param scope The scope will be binded to listener.
	 */
	on(name: K, listener: EventListener, scope?: object) {
		let events = this.__events[name] || (this.__events[name] = [])
		
		events.push({
			listener,
			scope,
			once: false,
		})
	}

	/**
	 * Register listener for specified event name for only once.
	 * @param name The event name.
	 * @param listener The event listener.
	 * @param scope The scope will be binded to listener.
	 */
	once(name: K, listener: EventListener, scope?: object) {
		let events = this.__events[name] || (this.__events[name] = [])

		events.push({
			listener,
			scope,
			once: true
		})
	}

	/**
	 * Stop listening specified event.
	 * @param name The event name.
	 * @param listener The event listener, only matched listener will be removed.
	 * @param scope The scope binded to listener. If provided, remove listener only when scope match.
	 */
	off(name: K, listener: EventListener, scope?: object) {
		let events = this.__events[name]
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
	 * Check if registered listener for specified event.
	 * @param name The event name.
	 * @param listener The event listener. If provided, will also check if the listener match.
	 * @param scope The scope binded to listener. If provided, will additionally check if the scope match.
	 */
	hasListener(name: string, listener?: EventListener, scope?: object) {
		let events = this.__events[name]

		if (!listener) {
			return !!events && events.length > 0
		}
		else if (events && listener) {
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
	 * Emit specified event with followed arguments.
	 * @param name The event name.
	 * @param args The arguments that will be passed to event listeners.
	 */
	emit(name: K, ...args: any[]) {
		let events = this.__events[name]
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

	/** Remove all event listeners */
	removeAllListeners() {
		this.__events = {}
	}
}
