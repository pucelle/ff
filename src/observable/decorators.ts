import {DependencyCapturer} from './dependency-capturer'
import {proxyOf} from './proxy'


const {onGet, onSet} = DependencyCapturer


/** 
 * Proxy an object and all of it's descendant properties, returns a property decoration.
 * After proxied, modifiying of this property, and also all of it's descendant properties,
 * will notify associated dependencies changed.
 * 
 * Note you should avoid using this frequently, because:
 * 1. It's 50x slower that normal property accessing.
 * 2. Get this property from what you get is not original object, but a proxied object.
 */
export function proxied<V = any>(target: any, property: string) {
	const ValueMap: WeakMap<object, V> = new WeakMap()

	const getter = function(this: object) {
		onGet(this, property)
		return ValueMap.get(this)
	}

	const setter = function(this: object, newValue: V) {
		let oldValue = ValueMap.get(this)
		if (newValue !== oldValue) {
			ValueMap.set(this, proxyOf(newValue) as V)
			onSet(this, property)
		}
	}
	
	Object.defineProperty(target, property, {
		configurable: false,
 		enumerable: true,
		get: getter,
		set: setter,
	})
}

