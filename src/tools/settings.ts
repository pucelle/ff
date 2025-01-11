import {EventFirer} from '../events'
import {Observed, trackGet, trackSet} from '../observing'
import {EmptyBundler} from './bundler'
import {webStorage} from './storage'


interface SettingsEvents<O extends object> {

	/** After setting an item. */
	'set': <K extends keyof O>(key: K, value: O[K] | undefined) => void
}


/** 
 * Manage settings data.
 * Otherwise you should specify a default options for it.
 */
export class Settings<O extends object> extends EventFirer<SettingsEvents<O>> implements Observed {

	protected data: Partial<O>
	protected readonly defaultData: O

	constructor(data: Partial<O>, defaultData: O) {
		super()
		this.data = data
		this.defaultData = defaultData
	}

	/** Set new data. */
	setData(data: Partial<O>) {
		trackSet(this, 'data')
		this.data = data
	}

	/** Get initial data. */
	getData(): Partial<O> {
		trackGet(this, 'data')
		return this.data
	}

	/** Get full data fulfilled by default data. */
	getFullData(): O {
		trackGet(this, 'data')
		return {...this.defaultData, ...this.data}
	}

	/** Has specified option by key. */
	has<K extends keyof O>(key: K): boolean {
		trackGet(this, 'data')
		trackGet(this.data, key)
		return this.data.hasOwnProperty(key)
	}

	/** Get option value by key, choose default value if option data doesn't specified it. */
	get<K extends keyof O>(key: K): O[K] {
		trackGet(this, 'data')
		trackGet(this.data, key)
		return this.data[key] ?? this.defaultData[key]!
	}

	/** Modify option key and value pair. */
	set<K extends keyof O>(key: K, value: O[K]) {
		if (this.data[key] !== value) {
			this.data[key] = value
			this.fire('set', key, value)
			trackSet(this.data, key)
		}
	}

	/** Modify option key and value pair. */
	delete<K extends keyof O>(key: K) {
		if (this.data[key] !== undefined) {
			delete this.data[key]
			this.fire('set', key, undefined)
			trackSet(this.data, key)
		}
	}
}


/** Used to caches settings, can restore them after reload page. */
export class StorableSettings<O extends object> extends Settings<O> {

	protected readonly storageKey: string
	protected saveBundler: EmptyBundler

	constructor(storageKey: string, defaultData: O) {
		if (!storageKey) {
			throw new Error(`You must provide "storageKey" when using "StorableSettings"!`)
		}
		
		super(webStorage.get(storageKey, {}), defaultData)

		this.storageKey = storageKey
		this.saveBundler = new EmptyBundler(this.saveStorageData.bind(this))
		this.initEvents()
	}

	protected initEvents() {
		this.on('set', () => this.saveBundler.call(), this)
	}

	/** Save data to storage. */
	protected saveStorageData() {
		webStorage.set(this.storageKey, this.data)
	}
}