import {Emitter} from "../base/emitter"

type InferFromDefault<T> = T extends null | undefined ? any : T


class JSONStorage {

	/** Key prefix to identify self set local storage properties. */
	private prefix: string = ''

	/** Expire suffix of properties to mark expire time. */
	private expireSuffix: string = '_expires_'

	/** Supported state cache. */
	private supported: boolean | null = null

	constructor(prefix: string) {
		this.prefix = prefix
	}

	/**
	 * Test whether local storage is supported.
	 * Will return `false` in browser's private mode. 
	 */
	isSupported(): boolean {
		if (this.supported !== null) {
			return this.supported
		}

		try {
			let key = this.prefix + 'test_supported'
			localStorage[key] = 1
			delete localStorage[key]
			return true
		}
		catch (e) {
			return false
		}
	}

	/**
	 * Test whether has set `key` in local storage.
	 * @param key The key of the data item.
	 */
	has(key: string): boolean | null {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		return key in localStorage
	}

	/**
	 * Get json data from local storage by `key`.
	 * @param key The key of the data item.
	 * @param defaultValue The default value to return when no data stored yet.
	 */
	get<T>(key: string, defaultValue: T): InferFromDefault<T>

	/**
	 * Get json data from local storage by `key`.
	 * @param key The key of the data item.
	 */
	get(key: string): any

	get(key: string, defaultValue: any = null): any {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		let value = localStorage[key]

		if (value === undefined) {
			return defaultValue
		}

		if (value && typeof value === 'string') {
			try{
				value = JSON.parse(value)
				let expires = localStorage[key + this.expireSuffix]
				if (expires && expires < Date.now()) {
					delete localStorage[key]
					delete localStorage[key + this.expireSuffix]
					return defaultValue
				}
				else {
					return value
				}
			}
			catch (err) {
				return defaultValue
			}
		}
		else {
			return defaultValue
		}
	}

	/**
	 * Cache json data into local storage by `key`.
	 * Returns `true` if cached. 
	 * @param key The key of the data item.
	 * @param value The json data to cache.
	 * @param expires An optional expire time in second.
	 */
	set(key: string, value: any, expires?: number): boolean | null {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		localStorage[key] = JSON.stringify(value)

		if (expires && expires > 0) {
			localStorage[key + this.expireSuffix] = Date.now() + expires * 1000
		}

		return true
	}

	/**
	 * Delete cached json data in localStorage by `key`.
	 * Returns `true` if deleted.
	 * @param key The key of the data item.
	 */
	delete(key: string): boolean | null {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		delete localStorage[key + this.expireSuffix]

		return delete localStorage[key]
	}

	/**
	 * Returns a new storage to cache data using `namespace` as prefix.
	 * @param namespace The prefix of keys.
	 */
	group(namespace: string) {
		return new JSONStorage(this.prefix + '_' + namespace)
	}
}


/** Like `LocalStorage` very much, except here it read and write JSON datas. */
export const storage = new JSONStorage('_ff_')


interface SettingsEvents<O> {
	change: (key: keyof O) => void
}

/** Used to caches settings, can restore them after reload page. */
export class Settings<O extends Object, E = any> extends Emitter<SettingsEvents<O> & E> {

	protected readonly storageKey: string
	protected readonly defaultData: O
	protected storageData!: O
	protected willSave: boolean = false

	constructor(storageKey: string, defaultData: O) {
		super()
		this.storageKey = storageKey
		this.defaultData = defaultData
		this.initializeDate()
	}

	protected initializeDate() {
		let defaultKeys = Object.keys(this.defaultData)
		let storageData = this.getStorageData()

		// Key must exist in default data.
		if (storageData) {
			for (let key of Object.keys(storageData)) {
				if (!defaultKeys.includes(key)) {
					delete(storageData[key])
				}
			}
		}
		
		this.storageData = storageData || {}
	}

	/** Returns whether have set this property. */
	has<K extends keyof O>(key: K): boolean {
		return this.storageData.hasOwnProperty(key)
	}

	/** Get setting value by key. */
	get<K extends keyof O>(key: K): O[K] {
		if (this.has(key)) {
			return this.storageData[key]
		}
		else {
			return this.defaultData[key]
		}
	}

	/** Set setting value by key. */
	set<K extends keyof O>(key: K, value: O[K]) {
		if (value !== this.storageData[key] || typeof value === 'object') {
			this.storageData[key] = value
			this.saveStorageData()
			this.emit('change', key)
		}
	}

	/** Delete a storage value by it's key. */
	delete<K extends keyof O>(key: K) {
		if (this.has(key)) {
			delete this.storageData[key]
			this.saveStorageData()
		}
	}

	/** Get raw data from local storage. */
	protected getStorageData(): any {
		return storage.get(this.storageKey)
	}

	/** Save data to local storage, note it doesn't save immediately. */
	protected saveStorageData() {
		if (!this.willSave) {
			Promise.resolve().then(() => {
				this.saveStorageDataImmediately()
				this.willSave = false
			})
			this.willSave = true
		}
	}

	/** Save data to local storage, note it doesn't save immediately. */
	protected saveStorageDataImmediately() {
		storage.set(this.storageKey, this.storageData)
	}
}