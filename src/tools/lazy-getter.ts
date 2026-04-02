
/** Normally for get initialize lazily in SSR environment. */
export class LazyGetter<T> {

	private getter: () => T
	private result: T | null = null

	constructor(getter: () => T) {
		this.getter = getter
	}

	/** Get and will initialize if not yet. */
	get value(): T {
		if (!this.result) {
			this.result = this.getter()
		}

		return this.result
	}
}
