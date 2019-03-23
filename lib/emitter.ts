type EventHandler = (...args: any[]) => void

interface EventListener {
	handler: EventHandler
	scope?: object,
	once: boolean
}


/** An event emitter to listen and emit events. */
export class Emitter<Events = any> {

	private _events: {[key: string]: EventListener[]} = {}

	/**
	 * Register listener for specified event name.
	 * @param name The event name.
	 * @param handler The event handler.
	 * @param scope The scope will be binded to handler.
	 */
	on<K extends keyof Events & string>(name: K, handler: Events[K] & EventHandler, scope?: object) {
		let events = this._events[name] || (this._events[name] = [])
		
		events.push({
			handler,
			scope,
			once: false,
		})
	}

	/**
	 * Register listener for specified event name for only once.
	 * @param name The event name.
	 * @param handler The event handler.
	 * @param scope The scope will be binded to handler.
	 */
	once<K extends keyof Events & string>(name: K, handler: Events[K] & EventHandler, scope?: object) {
		let events = this._events[name] || (this._events[name] = [])

		events.push({
			handler,
			scope,
			once: true
		})
	}

	/**
	 * Stop listening specified event.
	 * @param name The event name.
	 * @param handler The event handler, only matched listener will be removed.
	 * @param scope The scope binded to handler. If provided, remove listener only when scope match.
	 */
	off<K extends keyof Events & string>(name: K, handler: Events[K] & EventHandler, scope?: object) {
		let events = this._events[name]
		if (events) {
			for (let i = events.length - 1; i >= 0; i--) {
				let event = events[i]
				if (event.handler === handler && (!scope || event.scope === scope)) {
					events.splice(i, 1)
				}
			}
		}
	}

	/**
	 * Check if registered listener for specified event.
	 * @param name The event name.
	 * @param handler The event handler. If provided, will also check if the handler match.
	 * @param scope The scope binded to handler. If provided, will additionally check if the scope match.
	 */
	hasListener(name: string, handler?: EventHandler, scope?: object) {
		let events = this._events[name]

		if (!handler) {
			return !!events && events.length > 0
		}
		else if (events && handler) {
			for (let i = 0, len = events.length; i < len; i++) {
				let event = events[i]

				if (event.handler === handler && (!scope || event.scope === scope)) {
					return true
				}
			}
		}

		return false
	}

	/**
	 * Emit specified event with followed arguments.
	 * @param name The event name.
	 * @param args The arguments that will be passed to event handlers.
	 */
	emit<K extends keyof Events & string>(name: K, ...args: Parameters<Events[K] & EventHandler>) {
		let events = this._events[name]
		if (events) {
			for (let i = 0; i < events.length; i++) {
				let event = events[i]

				//the handler may call off, so must remove it before handling
				if (event.once === true) {
					events.splice(i--, 1)
				}

				event.handler.apply(event.scope, args)
			}
		}
	}

	/** Remove all event slisteners */
	removeAllListeners() {
		this._events = {}
	}
}
