import {ObjectUtils} from '../utils'
import {DependencyCapturer} from './dependency-capturer'
import {proxyOf} from './proxy'


// Distinguish to proxied.
type Target = object

const {onGet, onSet, startCapture, endCapture, DepedencyMap} = DependencyCapturer


/** 
 * Observe specified property, returns a property decoration.
 * After observed, modifiying of this property will notify associated dependencies to change.
 */
export function observable<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DepedencyMap()

	const getter = function(this: Target) {

		// Add dependency.
		onGet(SymbolMap.get(this))

		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let oldValue = ValueMap.get(this)

		if (newValue !== oldValue) {
			ValueMap.set(this, newValue)

			// Notify dependency changes.
			onSet(SymbolMap.get(this))
		}
	}

	Object.defineProperty(target, property, {
		configurable: false,
 		enumerable: true,
		get: getter,
		set: setter,
	})
}


/** 
 * Deeply observe specified property, returns a property decoration.
 * After observed, new value after set will be compare with old value using `deepEqual`,
 * and value is changed, will notify associated dependencies to change.
 */
export function deepObservable<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DepedencyMap()

	const getter = function(this: Target) {
		onGet(SymbolMap.get(this))
		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let oldValue = ValueMap.get(this)

		if (!ObjectUtils.deepEqual(newValue, oldValue)) {
			ValueMap.set(this, newValue)
			onSet(SymbolMap.get(this))
		}
	}

	Object.defineProperty(target, property, {
		configurable: false,
 		enumerable: true,
		get: getter,
		set: setter,
	})
}


/** 
 * Proxy an object and all of it's descendant properties, returns a property decoration.
 * After proxied, modifiying of this property, and also all of it's descendant properties,
 * will notify associated dependencies changed.
 * 
 * Note you should avoid using this frequently, because:
 * 1. It's 50x slower.
 * 2. Get this property from what you get is not original object, but a proxied object.
 */
export function proxied<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DepedencyMap()

	const getter = function(this: Target) {
		onGet(SymbolMap.get(this))
		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let oldValue = ValueMap.get(this)
		if (newValue !== oldValue) {
			ValueMap.set(this, proxyOf(newValue) as V)
			onSet(SymbolMap.get(this))
		}
	}
	
	Object.defineProperty(target, property, {
		configurable: false,
 		enumerable: true,
		get: getter,
		set: setter,
	})
}


/** 
 * Make a computed value, returns an accessor decoration.
 * and automatically update the value by re-computing after any dependency changed.
 */
export function computed<V = any>(_target: any, _property: string, descriptor: TypedPropertyDescriptor<V>) {
	const originalGetter = descriptor.get!

	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DepedencyMap()

	const getter = function(this: Target) {
		let hasValueSet = ValueMap.has(this)
		let value: V

		// Cached value is OK.
		if (hasValueSet) {
			value = ValueMap.get(this)!
		}

		// Compute new value.
		else {

			// Start to capture dependency.
			startCapture(reset, this)

			try {
				value = originalGetter.call(this)
				ValueMap.set(this, value)
			}
			catch (err) {
				console.warn(err)
			}
			
			// Always end capturing dependency.
			finally {
				endCapture()
			}
		}

		// computed value is also an observed value.
		onGet(SymbolMap.get(this))

		return value!
	}

	const reset = function(this: Target) {
		ValueMap.delete(this)!

		// Reset is nearly equals set it.
		onSet(SymbolMap.get(this))
	}

	descriptor.get = getter
}

