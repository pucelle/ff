import {ObjectUtils} from '../utils'
import {logger} from '../tools'
import {DependencyCapturer} from './dependency-capturer'
import {observeAny} from './helpers/proxy-observer'


type Target = object


/** 
 * Help to watch the setting of specified property, returns a property decoration.
 * After observed, setting of this property will cause dependencies to update.
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
 * Help to watch the setting of specified property, returns a property decoration.
 * After value or sub values change using `deepEqual` to compare,
 * will cause dependencies to update.
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
 * Help to watch the setting of specified property, returns a property decoration.
 * After observed, setting of this property, and also all descendant properties,
 * will cause dependencies to update.
 */
export function cloneOfObserve<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<Target, V> = new WeakMap()
	const SymbolMap = new DependencyCapturer.DepedencyMap()
	const ClonedMap: WeakMap<Target, V> = new WeakMap()

	const getter = function(this: Target) {
		DependencyCapturer.onGet(SymbolMap.get(this))
		return ValueMap.get(this)
	}

	const setter = function(this: Target, newValue: V) {
		let cloned = ClonedMap.get(this)

		if (!ObjectUtils.deepEqual(newValue, cloned)) {
			ValueMap.set(this, newValue)
			ClonedMap.set(this, ObjectUtils.deepClone(newValue))
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
 * will cause dependencies to update.
 * 
 * Note you should avoid using this frequently, because:
 * 1. It's 50x slower.
 * 2. Get this property what you get is not original object, but a proxied object.
 */
export function proxyOfObserve<V = any>(target: any, property: string) {
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
 * and automatically update it when piped / observed properties changed.
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
				logger.warn(err)
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

