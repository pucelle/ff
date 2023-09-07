import {DBStorage, DBStore} from './db-storage'
import {InferTypeOf} from './web-storage'


/** 
 * Same as WebStorage,
 * Except it uses indexedDB to privide much bigger storage space,
 * normally 15% of disk space.
 */
export class BiggerStorage {

	/** Storage key suffix for expiring estimation. */
	private expiringSuffix: string = '_expires_at'

	/** Database connection. */
	private db: DBStorage

	/** Store for current storage. */
	private store: DBStore | null | undefined = undefined

	constructor(db: DBStorage) {
		this.db = db
	}

	/** Promise of whether supported. */
	isSupported(): Promise<boolean> {
		return this.db.isSupported()
	}

	private async getStore(): Promise<DBStore | null> {
		if (!this.db) {
			return null
		}

		if (this.store === undefined) {
			this.store = await this.db.getStore('storage')
		}

		return this.store
	}

	/** Whether has value in key. */
	async has(key: string): Promise<boolean> {
		let store = await this.getStore()
		return store
			? await store.has(key)
			: false
	}

	/** Get value by key, can specify a default value. */
	get<T>(key: string, defaultValue: T): Promise<InferTypeOf<T>>

	/** Get value by key. */
	get(key: string): Promise<any>

	async get(key: string, defaultValue: any = null): Promise<any> {
		let store = await this.getStore()
		if (store) {
			try {
				if (await store.has(key)) {
					let value = await store.get(key)
					value = JSON.parse(value)
					
					let expires = await store.get(key + this.expiringSuffix)
					if (expires && expires < Date.now()) {
						await store.delete(key)
						await store.delete(key + this.expiringSuffix)
						return defaultValue
					}
					else {
						return value
					}
				}
				else {
					return defaultValue
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
	 * Set a key value pair.
	 * Can set `expireSeconds` after which it will become expired.
	 */
	async set(key: string, value: any, expireSeconds?: number): Promise<boolean | null> {
		let store = await this.getStore()
		if (store) {
			try {
				await store.put(JSON.stringify(value), key)

				if (expireSeconds && expireSeconds > 0) {
					await store.put(Date.now() + expireSeconds * 1000, key + this.expiringSuffix)
				}

				return true
			}
			catch (err) {
				return null
			}
		}
		else {
			return null
		}
	}

	/** Delete value in key, returns whether deleted. */
	async delete(key: string): Promise<boolean | null> {
		let store = await this.getStore()
		if (store) {
			try {
				await store.delete(key)
				await store.delete(key + this.expiringSuffix)
				return true
			}
			catch (err) {
				return null
			}
		}
		else {
			return null
		}
	}

	/** Clear all data in storage. */
	async clear(): Promise<boolean | null> {
		let store = await this.getStore()
		if (store) {
			await store.clear()
			return true
		}
		else {
			return null
		}
	}

	/** Clear all the expired data in storage. */
	async clearExpired(): Promise<boolean | null> {
		let store = await this.getStore()
		if (store) {
			try {
				let keys = await store.getAllKeys()
				let currentTime = new Date().getTime()

				for (let key of keys) {
					if (key.endsWith(this.expiringSuffix)) {
						let value = await store.get(key) as number

						if (currentTime > value) {
							let rawKey = key.slice(0, -this.expiringSuffix.length)
							await this.delete(rawKey)
							await this.delete(key)
						}
					}
				}

				return true
			}
			catch (err) {
				return null
			}
		}
		else {
			return null
		}
	}

	/** 
	 * Clear all expired data in storage, but was limitted to not clear too often.
	 * `clearInterval` specifies a interval duration in seconds,
	 * in which period can clear only once, it's default value is one day.
	 */
	async clearExpiredThrottled(clearIntervalSeconds: number = 24 * 60 * 60) {
		let currentTime = new Date().getTime()
		let canClearAfter = (await this.get('clear_cache_at', 0)) + clearIntervalSeconds * 1000
		
		if (canClearAfter < currentTime) {
			await this.clearExpired()
			await this.set('clear_cache_at', currentTime)
		}
	}
}


/** Default global bigger storage API. */
export const biggerStorage = new BiggerStorage(
	new DBStorage('ff_storage', 1, [{name: 'storage'}])
)
