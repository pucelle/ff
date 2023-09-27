import {ListMap} from '../structs'


/** Cache event listener and scope. */
export interface EventListenerItem {
	handler: any
	scope: any
	once: boolean
}

/** Inder function parameters. */
export type InferParameters<T> = T extends (...args: any) => any ? T extends (...args: infer P) => any ? P : any[] : any[]


/** 
 * For registering and firing event.
 * 
 * How to make event interfaces can extend:
 * Assume:
 *     `A<E> extents EventFirer<E> {}`
 *     `B<E = BEvents> extents A<E> {}`
 * And would like to infer event paramters, can declare method in B like:
 *     `(this: B) { this.on(...)}`
 */
export class EventFirer<E = any> implements EventTarget {

	private eventListenerMap: ListMap<string, EventListenerItem> = new ListMap()
	private broadcastToMap: Map<EventFirer, any[] | Record<any, any> | null> = new Map()

	/** 
	 * Bind event listeners.
	 * Can specify `scope` to identify listener, and passes it to listener handler.
	 */
	on<T extends keyof E>(type: T | T[], handler: E[T], scope: any = null) {
		for (let subType of Array.isArray(type) ? type : [type]) {
			this.eventListenerMap.add(subType as string, {
				handler,
				scope,
				once: false,
			})
		}
	}

	/** 
	 * Bind event listeners, trigger for only once.
	 * Can specify `scope` to identify listener, and will pass it to listener handler.
	 */
	once<T extends keyof E>(type: T | T[], handler: E[T], scope: any = null) {
		for (let subType of Array.isArray(type) ? type : [type]) {
			this.eventListenerMap.add(subType as string, {
				handler: handler,
				scope,
				once: true,
			})
		}
	}

	/** 
	 * Unbind event listeners.
	 * If listener binds a `scope`, here must match it to remove the listener.
	 */
	off<T extends keyof E>(type: T | T[], handler: E[T], scope: any = null) {
		for (let subType of Array.isArray(type) ? type : [type]) {
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

			// Avoid newly binded handler got fired.
			listeners = [...listeners]

			for (let i = 0; i < listeners.length; i++) {
				let listener = listeners[i]

				if (listener.once === true) {
					this.eventListenerMap.delete(type as string, listener)
				}

				listener.handler.apply(listener.scope, args)
			}
		}

		if (this.broadcastToMap) {
			for (let [to, types] of this.broadcastToMap.entries()) {
				let mappedType = this.getMappedBroadcastType(type as string, types)
				if (mappedType) {
					to.fire(mappedType, ...args)
				}
			}
		}
	}

	/** Get mapped broadcast event name. */
	private getMappedBroadcastType(type: string, types: any[] | Record<string, string> | null): string | null {
		if (!types) {
			return type
		}
		else if (Array.isArray(types)) {
			return types.includes(type) ? type: null
		}
		else {
			return types[type] ?? null
		}
	}

	/** Whether `listener` in type is being listening on. */
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

	/** Whether have registered any listener. */
	hasListeners(): boolean {
		return this.eventListenerMap.keyCount() > 0
	}

	/** Whether have registered listener in type. */
	hasListenerType<T extends keyof E>(type: T): boolean {
		return this.eventListenerMap.hasOf(type as string) || false
	}

	/** Removes all the event listeners. */
	removeAllListeners() {
		this.eventListenerMap.clear()
	}	

	/** Broadcast event to a target event firer. */
	broadcastTo<TE = any>(target: EventFirer<TE>, types: (keyof E)[] | Partial<Record<keyof E, keyof TE>> | null = null) {
		this.broadcastToMap.set(target, types)
	}

	/** Cancel broadcasting to target. */
	unBroadcastTo(target: EventFirer) {
		this.broadcastToMap.delete(target)
	}
	
	/** Just ensure it is compatible with `EventTarget`. */
	addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
		if (typeof options === 'object' && options.once || options === true) {
			this.once(type as any, callback as any)
		}
		else {
			this.on(type as any, callback as any)
		}
	}

	/** Just ensure it is compatible with `EventTarget`. */
    dispatchEvent(event: Event): boolean {
		this.fire(event.type as any, ...[event] as any)
		return !event.cancelable || !event.defaultPrevented
	}

    /** Just ensure it is compatible with `EventTarget`. */
    removeEventListener(type: string, callback: EventListenerOrEventListenerObject | null, _options?: EventListenerOptions | boolean) {
		this.off(type as any, callback as any)
	}
}