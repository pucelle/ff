import {ListMap} from '../structs'


/** Cache event handler and scope. */
interface EventListenerItem {
	handler: any
	scope: any
	once: boolean
}

/** Infer function parameters. */
type InferParameters<T> = T extends (...args: any) => any ? T extends (...args: infer P) => any ? P : any[] : any[]


/** 
 * For registering and firing event.
 * 
 * How to make event interfaces can be extended?
 * 
 * Assume:
 * ```
 * A<E = any> extents EventFirer<E> {}
 * B<E = BEvents> extents A<E> {}
 * ```
 * 
 * To be able to infer event parameters for `B`, can declare it as `B<{}>`, like:
 * ```
 * (this: B<{}>) {this.on(...)}
 * ```
 */
export class EventFirer<E = any> {

	private eventListenerMap: ListMap<string, EventListenerItem> = new ListMap()

	/** 
	 * Bind event listener.
	 * Can specify `scope` to identify listener, and will pass it to listener handler.
	 */
	on<T extends keyof E>(type: T, handler: E[T], scope: any = null) {
		for (let subType of [type]) {
			this.eventListenerMap.add(subType as string, {
				handler,
				scope,
				once: false,
			})
		}
	}

	/** 
	 * Bind event listener, trigger for only once.
	 * Can specify `scope` to identify listener, and will pass it to listener handler.
	 */
	once<T extends keyof E>(type: T, handler: E[T], scope: any = null) {
		for (let subType of [type]) {
			this.eventListenerMap.add(subType as string, {
				handler: handler,
				scope,
				once: true,
			})
		}
	}

	/** 
	 * Unbind event listener.
	 * If listener binds a `scope`, here must match it to remove the listener.
	 */
	off<T extends keyof E>(type: T, handler: E[T], scope: any = null) {
		for (let subType of [type]) {
			let listeners = this.eventListenerMap.get(subType as string)
			if (!listeners) {
				continue
			}

			for (let i = listeners.length - 1; i >= 0; i--) {
				let listener = listeners[i]
				if (listener.handler === handler && (!scope || listener.scope === scope)) {
					this.eventListenerMap.delete(subType as string, listener)
				}
			}
		}
	}

	/** 
	 * Fire a event in `type`, and can specify parameters `args`.
	 * Strongly suggest call it as protected type.
	 */
	fire<T extends keyof E>(type: T, ...args: InferParameters<E[T]>) {
		let listeners = this.eventListenerMap.get(type as string)
		if (listeners) {

			// Avoid newly bound handler got fired.
			listeners = [...listeners]

			for (let i = 0; i < listeners.length; i++) {
				let listener = listeners[i]

				if (listener.once === true) {
					this.eventListenerMap.delete(type as string, listener)
				}

				listener.handler.apply(listener.scope, args)
			}
		}
	}

	/** Whether `listener` with specified type is being listening on. */
	hasListener(type: string, handler: Function, scope?: object): boolean {
		let listeners = this.eventListenerMap?.get(type as any)
		if (listeners) {
			for (let i = 0, len = listeners.length; i < len; i++) {
				let listener = listeners[i]
				if (listener.handler === handler && (!scope || listener.scope === scope)) {
					return true
				}
			}
		}

		return false
	}

	/** Whether have registered any type of listener. */
	hasListeners(): boolean {
		return this.eventListenerMap.keyCount() > 0
	}

	/** Whether have registered listener with type. */
	hasListenerType<T extends keyof E>(type: T): boolean {
		return this.eventListenerMap.hasOf(type as string) || false
	}

	/** Removes all the event listeners. */
	removeAllListeners() {
		this.eventListenerMap.clear()
	}
}