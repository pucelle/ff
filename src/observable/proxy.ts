import {DependencyTracker} from './dependency-tracker'


type Proxied<T> = T extends object ? T & {ProxySymbol: T} : T


/** To find proxied object. */
const {onGet, onSet} = DependencyTracker
const ProxyMap: WeakMap<object | Proxied<any>, Proxied<any>> = new WeakMap()


/** 
 * Proxy an object or an array, returns the proxied object.
 * Track properties, or deep descendant properties of this object or array,
 * Change them will cause the dependency callback function that depend on them to be called.
 * 
 * Multiple times of proxy a same object will always return the same output.
 * Otherwise note after tracked, properties accessing is 50x slower. So, avoid use it often.
 * 
 * Normally the compile-time depedency-tracking would be enough to track the change of observable object,
 * but if you meet these scenories, you may need `proxyOf`:
 *   1. You want to track all the properties of an object.
 *   2. You want to track deep descendant properties of an object.
 */
export function proxyOf<T extends object>(v: T): Proxied<T> {
	if (!v || typeof v !== 'object') {
		return v
	}

	return proxyObject(v)
}


/** Proxy an object. */
function proxyObject<T extends object>(o: T | Proxied<T>): Proxied<T> {

	// May become a proxied object already.
	let proxy = ProxyMap.get(o)
	if (proxy) {
		return proxy
	}

	if (Array.isArray(o)) {
		proxy = proxyArray(o)
	}
	else {
		proxy = proxyPlainObject(o)
	}

	ProxyMap.set(o, proxy)
	ProxyMap.set(proxy, proxy)

	return proxy
}


/** Proxy an plain object. */
function proxyPlainObject<T extends object>(o: T): Proxied<T> {
	return new Proxy(o, PlainObjectProxyHandler)
}


/** Proxy an array. */
function proxyArray<T extends any[]>(a: T): Proxied<T> {
	return new Proxy(a, ArrayProxyHandler)
}


/** For observing plain object. */
const PlainObjectProxyHandler = {

	get(o: any, key: PropertyKey): Proxied<any> {
		onGet(o, key)
		return proxyOf(o[key])
	},

	set(o: any, key: PropertyKey, toValue: any): true {
		let fromValue = o[key]
		o[key] = toValue

		if (fromValue !== toValue) {
			onSet(o, key)
		}

		return true
	},

	deleteProperty(o: any, key: PropertyKey): boolean {
		let result = delete o[key]
		if (result) {
			onSet(o, key)
		}

		return result
	},
}


/** For array proxy. */
const ArrayProxyHandler = {

	get(a: any, key: PropertyKey): Proxied<any> {
		let value = a[key]
		let type = typeof value

		// Proxy returned element in array.
		if (typeof key === 'number') {
			onGet(a, key)
			return proxyOf(value)
		}

		// Proxy array methods.
		else if (type === 'function') {
			return ArrayProxyMethods[key] ?? a[key]
		}

		// Other properties, like `length`.
		else {
			onGet(a)
			return value
		}
	},

	set(a: any, key: PropertyKey, toValue: any): true {
		let fromValue = a[key]
		a[key] = toValue

		if (fromValue !== toValue) {
			onSet(a)
		}

		return true
	},
}


/** Overwrite array methods. */
const ArrayProxyMethods: any = {

	push: function(this: any[], ...values: any[]) {
		let result = Array.prototype.push.call(this, ...values)

		if (values.length > 0) {
			onSet(this)
		}

		return result
	},

	unshift: function(this: any[], ...values: any[]) {
		let result = Array.prototype.unshift.call(this, ...values)

		if (values.length > 0) {
			onSet(this)
		}

		return result
	},

	pop: function(this: any[]) {
		let count = length
		let result = Array.prototype.pop.call(this)

		if (count > 0) {
			onSet(this)
		}

		return result
	},

	shift: function(this: any[]) {
		let count = length
		let result = Array.prototype.shift.call(this)

		if (count > 0) {
			onSet(this)
		}

		return result
	},

	splice: function(this: any[], fromIndex: number, removeCount: number, ...insertValues: any[]) {
		let result = Array.prototype.splice.call(this, fromIndex, removeCount, insertValues)

		if (removeCount > 0 || insertValues.length > 0) {
			onSet(this)
		}

		return result
	},

	reverse: function(this: any[]) {
		let result = Array.prototype.reverse.call(this)
		onSet(this)
		
		return result
	},
}
