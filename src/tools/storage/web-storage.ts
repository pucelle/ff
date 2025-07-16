import {DurationObject} from '../../utils'


/** Cached whether supported. */
let cachedSupported: boolean | null = null


/** 
 * Read and write JSON type of data according to `localStorage` API.
 * Cache memory limitation is about 5M.
 */
export class WebStorage {

	/** Storage key prefix. */
	private prefix: string = ''

	/** Storage key suffix for expiring estimation. */
	private expiringSuffix: string = '_expires_at'

	constructor(prefix: string) {
		this.prefix = prefix
	}

	/** 
	 * Whether support `localStorage` API.
	 * Normally it returns `false` in private mode.
	 */
	isSupported(): boolean {
		if (cachedSupported !== null) {
			return cachedSupported
		}

		try {
			let key = 'flit_test_supported'
			localStorage[key] = 'test'
			let supported = localStorage[key] === 'test'
			delete localStorage[key]
			return cachedSupported = supported
		}
		catch (e) {
			return false
		}
	}

	/** Whether has value storaged by it's associated key. */
	has(key: string): boolean {
		if (!this.isSupported()) {
			return false
		}

		key = this.prefix + key
		return key in localStorage
	}

	/** Get value by associated key, can specify a default value. */
	get<T>(key: string, defaultValue: T): NonNullable<T>

	/** Get value by associated key. */
	get(key: string): any

	get(key: string, defaultValue: any = null): any {
		if (!this.isSupported()) {
			return defaultValue
		}

		key = this.prefix + key
		let value = localStorage[key]

		if (value === undefined) {
			return defaultValue
		}

		if (value && typeof value === 'string') {
			try {
				value = JSON.parse(value)
				let expires = localStorage[key + this.expiringSuffix]
				if (expires && expires < Date.now()) {
					delete localStorage[key]
					delete localStorage[key + this.expiringSuffix]
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
	 * Set a key value pair.
	 * 
	 * @param expireDuration specifies after which the specified data will become expired.
	 * it can be a duration object, duration string, or a second count.
	 */
	set(key: string, value: any, expireDuration?: DurationObject | string | number): boolean {
		if (!this.isSupported()) {
			return false
		}

		key = this.prefix + key
		localStorage[key] = JSON.stringify(value)

		if (expireDuration) {
			let seconds = DurationObject.fromAny(expireDuration).toSeconds()
			if (seconds > 0) {
				localStorage[key + this.expiringSuffix] = Date.now() + seconds * 1000
			}
		}

		return true
	}

	/** Delete value in key, returns whether deleted. */
	delete(key: string): boolean {
		if (!this.isSupported()) {
			return false
		}

		key = this.prefix + key
		delete localStorage[key + this.expiringSuffix]

		return delete localStorage[key]
	}

	/** Clear all the data in storage. */
	clear(): boolean {
		localStorage.clear()
		return true
	}

	/** Clear all expired data. */
	clearExpired() {
		let currentTime = new Date().getTime()

		for (let i = 0; i < localStorage.length; i++) {
			let key = localStorage.key(i)
			if (key && key.endsWith(this.expiringSuffix)) {
				let value = localStorage.get(key) as number

				if (currentTime > value) {
					let rawKey = key.slice(0, -this.expiringSuffix.length)
					localStorage.delete(rawKey)
					localStorage.delete(key)
				}
			}
		}
	}

	/** 
	 * Clear all expired data.
	 * 
	 * @param clearIntervalDuration specifies an duration,
	 * in which can clear only once, default value is one day.
	 */
	ClearExpiredThrottled(clearIntervalDuration: DurationObject | string | number = '1d') {
		let currentTime = new Date().getTime()
		let clearIntervalSeconds = DurationObject.fromAny(clearIntervalDuration).toSeconds()
		let canClearAfter = this.get('clear_cache_at', 0) + clearIntervalSeconds * 1000
		
		if (canClearAfter < currentTime) {
			this.clearExpired()
			this.set('clear_cache_at', currentTime)
		}
	}
}


/** Default global web storage API. */
export const webStorage = /*#__PURE__*/new WebStorage('ff_')
