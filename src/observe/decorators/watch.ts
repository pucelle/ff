import {beginTrack, endTrack, untrack} from '../dependency-tracker'
import {enqueueUpdate} from '../update-queue'


interface WatchOptions {

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

	private getter: () => V
	private callback: (value: V) => void
	private value: V | undefined = undefined
	private valueAssigned: boolean = false
	private options: WatchOptions

	constructor(getter: () => V, callback: (value: V) => void, scope?: any, options?: Partial<WatchOptions>) {
		this.getter = scope ? getter.bind(scope) : getter
		this.callback = scope ? callback.bind(scope) : callback
		this.options = options ? {...DefaultWatchOptions, ...options} : DefaultWatchOptions
	}

	private onDepChange() {
		enqueueUpdate(this.update, this)
	}

	update() {
		let value: V

		try {
			beginTrack(this.onDepChange, this)
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
			this.callback(value!)
		}
		
		this.value = value!
		this.valueAssigned = true

		if (shouldCallback && this.options.once) {
			this.clear()
		}
		else if (this.options.untilTrue && value!) {
			this.clear()
		}
	}

	connect() {
		this.update()
	}

	disconnect() {
		untrack(this.onDepChange, this)
	}

	clear() {
		untrack(this.onDepChange, this)
	}
}


/** Infer getters by value list. */
type InferValueGetters<V extends any[]> = {[K in keyof V]: () => V[K]}

/** 
 * Watch returned values of `getters` and calls `callback` after any of values become changed.
 * Not like `WatchMaker`, it accepts no options.
 * 
 * Normally use it to process the decoration of `@watch.`
 */
export class MultipleWatchMaker<V extends any[] = any> {

	private getters: InferValueGetters<V>
	private callback: (...value: V) => void
	private values: V | undefined = undefined

	constructor(getters: InferValueGetters<V>, callback: (...value: V) => void, scope?: any) {
		this.getters = scope ? getters.map(getter => getter.bind(scope)) as InferValueGetters<V> : getters
		this.callback = scope ? callback.bind(scope) : callback
	}

	private onDepChange() {
		enqueueUpdate(this.update, this)
	}

	update() {
		let values: V

		try {
			beginTrack(this.onDepChange, this)
			values = this.getters.map(getter => getter()) as V
		}
		catch (err) {
			console.error(err)
		}
		finally {
			endTrack()
		}

		if (values!) {
			let shouldCallback = this.values && !this.compare(values, this.values!)
			if (shouldCallback) {
				this.callback(...values)
			}
			
			this.values = values
		}
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

	connect() {
		this.update()
	}

	disconnect() {
		untrack(this.onDepChange, this)
	}

	clear() {
		untrack(this.onDepChange, this)
	}
}