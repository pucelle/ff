class JSONStorage {

	private prefix: string = '_fdom_'
	private expireSuffix: string = '_expires_'
	private supported: boolean | null = null

	/**
	 * Test if storage is supported. Will return false in private mode. 
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
	 * Test if has set key.
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
	 * Get json data from key.
	 * @param key The string type key.
	 */
	get(key: string): unknown {
		if (!this.isSupported()) {
			return null
		}

		key = this.prefix + key
		let value = localStorage[key]

		if (value && typeof value === 'string') {
			try{
				value = JSON.parse(value)
				let expires = localStorage[key + this.expireSuffix]
				if (expires && expires < Date.now()) {
					delete localStorage[key]
					delete localStorage[key + this.expireSuffix]
					return null
				}
				else {
					return value
				}
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
	 * Cache json data in key. Returns if cached. 
	 * @param key The string type key.
	 * @param value The json data to cache.
	 * @param expires An optional expire time in second.
	 */
	set(key: string, value: unknown, expires?: number): boolean | null {
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
	 * Delete cached json data in key. Returns if deleted.
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