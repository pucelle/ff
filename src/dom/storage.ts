class JSONStorage {

	private prefix: string = '_ff_'
	private expireSuffix: string = '_expires_'
	private supported: boolean | null = null

	/**
	 * Test if localStorage is supported. Will return false in private mode. 
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
	 * Test if has set key in localStorage.
	 * @param key 
	 */
	has(key: string): boolean | null {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		return key in localStorage
	}

	/**
	 * Get json data from localStorage by `key`.
	 * @param key The string type key.
	 * @param defaultValue The default value to return when data havn't been storaged.
	 */
	get<T>(key: string, defaultValue: T): T

	/**
	 * Get json data from localStorage by `key`.
	 * @param key The string type key.
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
	 * Cache json data into localStorage by `key`. Returns if cached. 
	 * @param key The string type key.
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
	 * Delete cached json data in localStorage by `key`. Returns if deleted.
	 * @param key The string type key.
	 */
	delete(key: string): boolean | null {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		delete localStorage[key + this.expireSuffix]

		return delete localStorage[key]
	}
}

export const storage = new JSONStorage()