import {Observed, UnObserved} from '@pucelle/lupos'
import {EmptyBundler} from './bundler'
import {webStorage} from './storage'


/** 
 * Manage settings data.
 * Otherwise you should specify a default options for it.
 */
export abstract class Settings<O extends object> implements Observed {

	private readonly defaultData: UnObserved<O>
	protected data: Partial<O>
	protected saveBundler: EmptyBundler

	constructor(data: Partial<O>, defaultData: O) {
		this.data = data
		this.defaultData = defaultData

		this.saveBundler = new EmptyBundler(this.saveStorageData.bind(this))
	}

	/** Get initial data. */
	getData(): Partial<O> {
		return this.data
	}

	/** Get full data fulfilled by default data. */
	getFullData(): O {
		return {...this.defaultData, ...this.data}
	}

	/** Has specified option by key. */
	has<K extends keyof O>(key: K): boolean {
		return this.data.hasOwnProperty(key)
	}

	/** Get option value by key, choose default value if option data doesn't specified it. */
	get<K extends keyof O>(key: K): O[K] {
		return this.data[key] ?? this.defaultData[key]!
	}

	/** Modify option key and value pair. */
	set<K extends keyof O>(key: K, value: O[K]) {
		if (this.data[key] !== value) {
			this.data[key] = value
			this.saveBundler.call()
		}
	}

	/** Set new data. */
	setData(data: Partial<O>) {
		this.data = data
		this.saveBundler.call()
	}

	/** Modify option key and value pair. */
	delete<K extends keyof O>(key: K) {
		if (this.data[key] !== undefined) {
			delete this.data[key]
			this.saveBundler.call()
		}
	}

	/** Save data to storage place. */
	protected abstract saveStorageData(): Promise<void> | void
}


/** Uses web storage to store settings data, can restore them after page reloaded. */
export class StorableSettings<O extends object> extends Settings<O> {

	protected readonly storageKey: string

	constructor(storageKey: string, defaultData: O) {
		if (!storageKey) {
			throw new Error(`You must provide "storageKey" when using "StorableSettings"!`)
		}
		
		super(webStorage.get(storageKey, {}), defaultData)
		this.storageKey = storageKey
	}

	/** Save data to storage. */
	protected saveStorageData() {
		webStorage.set(this.storageKey, this.data)
	}
}