interface EventListener {
	handler: Function
	scope?: object,
	once: boolean
}

const eventMap: WeakMap<Emitter, {[key: string]: EventListener[]}> = new WeakMap()

function getEvents(emitter: Emitter, name: string): EventListener[] {
	let map = eventMap.get(emitter)
	if (!map) {
		map = {}
		eventMap.set(emitter, map)
	}

	let events = map[name]
	if (!events) {
		events = map[name] = []
	}

	return events
}


export interface Events {
	[key: string]: (...args: any[]) => void
}

/** An event emitter to listen and emit events. */
export class Emitter<T extends Events = Events> {

	/**
	 * Register listener for specified event name.
	 * @param name The event name.
	 * @param handler The event handler.
	 * @param scope The scope will be binded to handler.
	 */
	on<K extends keyof T>(name: K, handler: T[K], scope?: object) {
		let events = getEvents(this, name as string)
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
	once<K extends keyof T>(name: K, handler: T[K], scope?: object) {
		let events = getEvents(this, name as string)
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
	off<K extends keyof T>(name: K, handler: T[K], scope?: object) {
		let events = getEvents(this, name as string)
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
	hasListener(name: string, handler?: Function, scope?: object) {
		let events = getEvents(this, name as string)

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
	emit<K extends keyof T>(name: K, ...args: Parameters<T[K]>) {
		let events = getEvents(this, name as string)
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
		eventMap.delete(this)
	}
}
