interface WillUpdatable {

	/** Notify that some depedencies have changed, and current object should be updated soon. */
	willUpdate(): void
}


/** 
 * Observe specified property, returns a property decoration.
 * After observed, modifiying of this property will notify current object to call `willUpdate`.
 */
export function causeUpdate<V = any>(target: WillUpdatable, property: string) {
	const ValueMap: WeakMap<WillUpdatable, V> = new WeakMap()

	const getter = function(this: WillUpdatable) {
		return ValueMap.get(this)
	}

	const setter = function(this: WillUpdatable, newValue: V) {
		let oldValue = ValueMap.get(this)

		if (newValue !== oldValue) {
			ValueMap.set(this, newValue)
			this.willUpdate()
		}
	}

	Object.defineProperty(target, property, {
		configurable: false,
 		enumerable: true,
		get: getter,
		set: setter,
	})
}
