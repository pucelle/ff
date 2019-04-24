type EventListener = (...args: any[]) => void

interface EventItem {
	listener: EventListener
	scope?: object,
	once: boolean
}

type FilterListeners<I> = {[K in keyof I]: BeListener<I[K]> }
type BeListener<V> = V extends (...args: infer Args) => void ? (...args: Args) => void : never
type KeyOfListeners<I> = keyof FilterListeners<I> & string

// Inspired by `https://stackoverflow.com/questions/55763701`.
// We meet a problem in inherit event types and giving event arguments limination and auto complete.

// At first, we are trying to merge event listener interfaces but failed,
// The main reason is when one of the the event listener interface is generic argument,
// we can't merge two event listener interfaces and infer types of listener arguments for one listener,
// The type of listener becomes `resolved Listener A & unresolved Listener B`, arguments of it can't be inferred.

// So here we exclude all the keys in Emitter from base class,
// and then merge with the extended class listener interface.
// Use it like `class B extends A as ExtendEvents(typeof A, EventsInterface)`
export type ExtendEvents<BaseConstructor extends new (...args: any) => any, Events>
	= (new (...a: ConstructorParameters<BaseConstructor>) => Exclude<InstanceType<BaseConstructor>, keyof Emitter> & Emitter<Events>)


/** An event emitter to listen and emit events. */
export class Emitter<Events = {}> {

	private __events: {[key: string]: EventItem[]} = {}

	/**
	 * Register listener for specified event name.
	 * @param name The event name.
	 * @param listener The event listener.
	 * @param scope The scope will be binded to listener.
	 */
	on<K extends KeyOfListeners<Events>>(name: K, listener: FilterListeners<Events>[K], scope?: object) {
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
	once<K extends KeyOfListeners<Events>>(name: K, listener: FilterListeners<Events>[K], scope?: object) {
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
	off<K extends KeyOfListeners<Events>>(name: K, listener: FilterListeners<Events>[K], scope?: object) {
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
	emit<K extends KeyOfListeners<Events>>(name: K, ...args: Parameters<FilterListeners<Events>[K]>) {
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