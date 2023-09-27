import {ObjectUtils} from '../utils'
import {DependencyCapturer} from './dependency-capturer'
import {observeAny} from './helpers/proxied-observer'


type Target = object


/** 
 * Observe specified property, returns a property decoration.
 * After observed, setting of this property will notify associated dependencies to change.
 */
export function observe<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DependencyCapturer.DepedencyMap()

	const getter = function(this: Target) {

		// Add dependency.
		DependencyCapturer.onGet(SymbolMap.get(this))

		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let oldValue = ValueMap.get(this)

		if (newValue !== oldValue) {
			ValueMap.set(this, newValue)

			// Notify dependency changes.
			DependencyCapturer.onSet(SymbolMap.get(this))
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
export function deepObserve<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DependencyCapturer.DepedencyMap()

	const getter = function(this: Target) {
		DependencyCapturer.onGet(SymbolMap.get(this))
		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let oldValue = ValueMap.get(this)

		if (!ObjectUtils.deepEqual(newValue, oldValue)) {
			ValueMap.set(this, newValue)
			DependencyCapturer.onSet(SymbolMap.get(this))
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
 * Use a proxy to watch property deeply, returns a property decoration.
 * After observed, setting of this property, and also all descendant properties,
 * will notify associated dependencies changed.
 * 
 * Note you should avoid using this frequently, because:
 * 1. It's 50x slower.
 * 2. Get this property what you get is not original object, but a proxied object.
 */
export function proxiedObserve<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DependencyCapturer.DepedencyMap()

	const getter = function(this: Target) {
		DependencyCapturer.onGet(SymbolMap.get(this))
		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let oldValue = ValueMap.get(this)
		if (newValue !== oldValue) {
			ValueMap.set(this, observeAny(newValue) as V)
			DependencyCapturer.onSet(SymbolMap.get(this))
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
 * Make a computed value, used as accessor decoration.
 * and automatically update the value by re-computing after any dependency changed.
 */
export function computed<V = any>(_target: any, _property: string, descriptor: TypedPropertyDescriptor<V>) {
	const originalGetter = descriptor.get!

	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DependencyCapturer.DepedencyMap()

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
			DependencyCapturer.startCapture(reset, this)

			try {
				value = originalGetter.call(this)
				ValueMap.set(this, value)
			}
			catch (err) {
				console.warn(err)
			}
			
			// Always end capturing dependency.
			finally {
				DependencyCapturer.endCapture()
			}
		}

		// computed value is also an observed value.
		DependencyCapturer.onGet(SymbolMap.get(this))

		return value!
	}

	const reset = function(this: Target) {
		ValueMap.delete(this)!

		// Reset is nearly equals set it.
		DependencyCapturer.onSet(SymbolMap.get(this))
	}

	descriptor.get = getter
}

