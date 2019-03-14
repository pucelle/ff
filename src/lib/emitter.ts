interface EventListener {
	handler: Function
	scope?: object,
	once: boolean
}

export interface Events {
	[key: string]: (...args: any[]) => void
}

export class Emitter<T extends Events> {

	private events: {[key in keyof T]?: EventListener[]} = {}

	/** An event emitter to listen and trigger events. */
	constructor() {}

	/**
	 * Register listener for specified event name.
	 * @param name The event name.
	 * @param handler The event handler.
	 * @param scope The scope will be binded to handler.
	 */
	on<K extends keyof T>(name: K, handler: T[K], scope?: object) {
		let events = this.events[name]
		if (!events) {
			events = this.events[name] = []
		}

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
		let events = this.events[name]

		if (!events) {
			events = this.events[name] = []
		}

		events.push({
			handler,
			scope,
			once: true
		})

		return this
	}

	/**
	 * Stop listening specified event.
	 * @param name The event name.
	 * @param handler The event handler, only matched listener will be removed.
	 * @param scope The scope binded to handler. If provided, remove listener only when scope match.
	 */
	off<K extends keyof T>(name: K, handler: T[K], scope?: object) {
		let events = this.events[name]
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
		let events = this.events[name]

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
		let events = this.events[name]
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
		this.events = {}
	}
}
