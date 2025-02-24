import {beginTrack, endTrack, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'
import {getIncrementalOrder} from './order'


export interface WatchOptions {

	/** If need to unwatch after first time calls callback. */
	once: boolean

	/** Whether calls callback immediately. */
	immediate: boolean

	/** If specified, stop watching when watching value becomes true like. */
	untilTrue: boolean
}


const DefaultWatchOptions: WatchOptions = {
	once: false,
	immediate: false,
	untilTrue: false,
}


/** 
 * Watch returned value of `getter` and calls `callback` after the value becomes changed.
 * 
 * If wanting to watch several values, can use `MultipleWatchMaker`,
 * but note `MultipleWatchMaker` accepts no option.
 */
export class WatchMaker<V = any> {

	readonly order = getIncrementalOrder()

	private getter: () => V
	private callback: (value: V, oldValue: V | undefined) => void
	private value: V | undefined = undefined
	private valueAssigned: boolean = false
	private options: WatchOptions
	private needsUpdate: boolean = false

	constructor(getter: () => V, callback: (value: V, oldValue: V | undefined) => void, scope?: any, options?: Partial<WatchOptions>) {
		this.getter = scope ? getter.bind(scope) : getter
		this.callback = scope ? callback.bind(scope) : callback
		this.options = options ? {...DefaultWatchOptions, ...options} : DefaultWatchOptions
	}

	connect() {
		this.willUpdate()
	}

	disconnect() {
		untrack(this.willUpdate, this)
	}

	private willUpdate() {
		if (this.needsUpdate) {
			return
		}

		enqueueUpdate(this.update, this, this.order)
		this.needsUpdate = true
	}

	update() {
		let value: V

		try {
			beginTrack(this.willUpdate, this)
			value = this.getter()
		}
		catch (err) {
			console.error(err)
		}
		finally {
			endTrack()
		}

		let shouldCallback = this.valueAssigned && value! !== this.value
			|| !this.valueAssigned && this.options.immediate

		if (shouldCallback) {
			this.callback(value!, this.value)
		}
		
		this.needsUpdate = false
		this.value = value!
		this.valueAssigned = true

		if (shouldCallback && this.options.once) {
			this.clear()
		}
		else if (this.options.untilTrue && value!) {
			this.clear()
		}
	}

	clear() {
		untrack(this.willUpdate, this)
	}
}


/** Infer getters by value list. */
type InferValueGetters<V extends any[]> = {[K in keyof V]: () => V[K]}

/** 
 * Watch returned values of `getters` and calls `callback` after any of values become changed.
 * Normally use it to process the decoration of `@watchMulti.`
 */
export class WatchMultiMaker<V extends any[] = any> {

	readonly order = getIncrementalOrder()

	private getters: InferValueGetters<V>
	private callback: (values: V, oldValues: V | undefined) => void
	private values: V | undefined = undefined
	private options: WatchOptions
	private needsUpdate: boolean = false

	constructor(getters: InferValueGetters<V>, callback: (values: V, oldValues: V | undefined) => void, scope?: any, options?: Partial<WatchOptions>) {
		this.getters = scope ? getters.map(getter => getter.bind(scope)) as InferValueGetters<V> : getters
		this.callback = scope ? callback.bind(scope) : callback
		this.options = options ? {...DefaultWatchOptions, ...options} : DefaultWatchOptions
	}

	connect() {
		this.willUpdate()
	}

	disconnect() {
		untrack(this.willUpdate, this)
	}

	private willUpdate() {
		if (this.needsUpdate) {
			return
		}

		enqueueUpdate(this.update, this, this.order)
		this.needsUpdate = true
	}

	update() {
		let values: V

		try {
			beginTrack(this.willUpdate, this)
			values = this.getters.map(getter => getter()) as V
		}
		catch (err) {
			console.error(err)
		}
		finally {
			endTrack()
		}

		if (values!) {
			let shouldCallback = this.values && values! && !this.compare(values, this.values!)
				|| !this.values && this.options.immediate

			if (shouldCallback) {
				this.callback(values!, this.values)
			}
			
			this.values = values
		}

		this.needsUpdate = false
	}

	/** Returns whether each value is same. */
	private compare(values1: V, values2: V): boolean {
		for (let i = 0; i < values1.length; i++) {
			if (values1[i] !== values2[i]) {
				return false
			}
		}

		return true
	}

	clear() {
		untrack(this.willUpdate, this)
	}
}