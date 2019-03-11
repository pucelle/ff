interface EventListener {
	handler: Function
	scope: object,
	once: boolean
}


export class Emitter<T extends {[key: string]: any[]}> {

	private events: {[key in keyof T]?: EventListener[]} = {}

	/**
	 * An event emitter to listen and trigger events.
	 */
	constructor() {}

	/**
	 * Register listener for specified event name.
	 * @param name Specify the event name.
	 * @param handler Specify the event handler.
	 * @param scope Specify the scope will be binded to handler.
	 */
	on<K extends keyof T>(name: K, handler: (...arg: T[K]) => void, scope: object) {
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
	 * @param name Specify the event name.
	 * @param handler Specify the event handler.
	 * @param scope Specify the scope will be binded to handler.
	 */
	once(name: string, handler: Function, scope: object) {
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
	 * @param name Specify the event name.
	 * @param handler Specify the event handler, only matched listener will be removed.
	 * @param scope Specify the scope binded to handler. If provided, remove listener only when scope match.
	 */
	off(name: string, handler: Function, scope?: object) {
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
	 * @param name Specify the event name.
	 * @param handler Specify the event handler. If provided, will also check if the handler match.
	 * @param scope Specify the scope binded to handler. If provided, will additionally check if the scope match.
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
	 * @param name Specify the event name.
	 * @param args Specify the arguments that will be passed to event handlers.
	 */
	emit(name: string, ...args: any[]) {
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

	/**
	 * Remove all event slisteners
	 */
	removeAllListeners() {
		this.events = {}
	}
}
