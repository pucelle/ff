import {Emitter} from '../base/emitter'
import {storage} from './storage'


interface SettingsEvents<O> {
	change: (key: keyof O) => void
}


/** Used to caches settings, can restore them after reload page. */
export class Settings<O extends Object, E = any> extends Emitter<SettingsEvents<O> & E> {

	protected readonly storageKey: string
	protected readonly defaultData: O
	protected storageData!: O
	protected willSave: boolean = false

	constructor(storageKey: string, defaultData: O = {} as any) {
		super()

		if (!storageKey) {
			throw new Error(`You must specify "storageKey" when using "Settings"!`)
		}
		
		this.storageKey = storageKey
		this.defaultData = defaultData
		this.storageData = this.getStorageData()
	}

	/** Get raw data from local storage. */
	protected getStorageData(): any {
		return storage.get(this.storageKey, {})
	}

	/** Remove data keys that not appears in default deta. */
	removeKeysNotInDefaultData() {
		let defaultKeys = Object.keys(this.defaultData) as (keyof O)[]

		// Key must exist in default data, or data item will be deleted.
		for (let key of Object.keys(this.storageData) as (keyof O)[]) {
			if (!defaultKeys.includes(key)) {
				delete(this.storageData[key])
			}
		}
	}

	/** Returns whether have set this property. */
	has<K extends keyof O>(key: K): boolean {
		return this.storageData.hasOwnProperty(key)
	}

	/** Get setting value by key. */
	get<K extends keyof O>(key: K, defaultValue: O[K] | null = null): O[K] {
		if (this.has(key)) {
			return this.storageData[key] ?? defaultValue!
		}
		else {
			return this.defaultData[key] ?? defaultValue!
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