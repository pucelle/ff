import {EventFirer} from '../events'
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
export class Settings<O extends object> extends EventFirer<SettingsEvents<O>> {

	protected data: Partial<O>
	protected defaultData: O

	constructor(data: Partial<O>, defaultData: O) {
		super()
		this.data = data
		this.defaultData = defaultData
	}

	/** Reload data. */
	setData(options: Partial<O>) {
		this.data = options
	}

	/** Get initial options data. */
	getData(): Partial<O> {
		return this.data
	}

	/** Get options data fulfilled by default data. */
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
			this.fire('set', key, value)
		}
	}

	/** Modify option key and value pair. */
	delete<K extends keyof O>(key: K) {
		if (this.data[key] !== undefined) {
			delete this.data[key]
			this.fire('set', key, undefined)
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

	/** Save data to local storage. */
	protected saveStorageData() {
		webStorage.set(this.storageKey, this.data)
	}
}