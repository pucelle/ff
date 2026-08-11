
/** Normally for get initialize lazily in SSR environment. */
export class LazyGetter<T> {

	private getter: () => T
	private result!: T
	private initialized = false

	constructor(getter: () => T) {
		this.getter = getter
	}

	/** Get and will initialize if not yet. */
	get value(): T {
		if (!this.initialized) {
			this.result = this.getter()
			this.initialized = true
		}

		return this.result
	}

	/** Reset cached value. */
	reset() {
		this.initialized = false
	}
}
