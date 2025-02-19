import {trackGet, trackSet} from './dependency-tracker'


type ProxyOf<T> = T extends object ? T & {ProxySymbol: T} : T


/** To find the proxy of an object. */
const ProxyMap: WeakMap<object | ProxyOf<any>, ProxyOf<any>> = new WeakMap()


/** 
 * Proxy an object or an array, map or set (not weak map or weak set), returns the proxy of an object.
 * Will track properties, or deep descendant properties of this object or array,
 * Change them will cause the dependency callback function that depend on them to be called.
 * But will not track elements of map or set.
 * 
 * Multiple times of proxy a same object will always return the same output.
 * Otherwise note after tracked, properties accessing is 50x slower. So, avoid use it often.
 * 
 * Normally the compile-time dependency-tracking would be enough to track the change of observable object,
 * but if you meet these scenarios, you may need `proxyOf`:
 *   1. You want to track all the properties of an object.
 *   2. You want to track deep descendant properties of an object.
 */
export function proxyOf<T extends object>(v: T): ProxyOf<T> {
	if (!v || typeof v !== 'object') {
		return v
	}

	return proxyObject(v)
}


/** Proxy an object. */
function proxyObject<T extends object>(o: T | ProxyOf<T>): ProxyOf<T> {

	// May become a proxy of object already.
	let proxy = ProxyMap.get(o)
	if (proxy) {
		return proxy
	}

	if (Array.isArray(o)) {
		proxy = proxyArray(o)
	}
	else {
		let string = o.toString()
		if (string === '[object Map]') {
			proxy = proxyMap(o as Map<any, any>)
		}
		else if (string === '[object Set]') {
			proxy = proxySet(o as Set<any>)
		}
		else {
			proxy = proxyPlainObject(o)
		}
	}

	ProxyMap.set(o, proxy)
	ProxyMap.set(proxy, proxy)

	return proxy
}


/** Proxy an plain object. */
function proxyPlainObject<T extends object>(o: T): ProxyOf<T> {
	return new Proxy(o, PlainObjectProxyHandler)
}


/** Proxy an array. */
function proxyArray<T extends any[]>(a: T): ProxyOf<T> {
	return new Proxy(a, ArrayProxyHandler)
}


/** Proxy a map. */
function proxyMap<T extends Map<any, any>>(a: T): ProxyOf<T> {
	return new Proxy(a, MapProxyHandler)
}


/** Proxy a set. */
function proxySet<T extends Set<any>>(a: T): ProxyOf<T> {
	return new Proxy(a, SetProxyHandler)
}


/** For observing plain object. */
const PlainObjectProxyHandler = {

	get(o: any, key: PropertyKey): ProxyOf<any> {
		trackGet(o, key)
		return proxyOf(o[key])
	},

	set(o: any, key: PropertyKey, toValue: any): true {
		let fromValue = o[key]
		o[key] = toValue

		if (fromValue !== toValue) {
			trackSet(o, key)
		}

		return true
	},

	deleteProperty(o: any, key: PropertyKey): boolean {
		let result = delete o[key]
		if (result) {
			trackSet(o, key)
		}

		return result
	},
}


/** For array proxy. */
const ArrayProxyHandler = {

	get(a: any, key: PropertyKey): ProxyOf<any> {
		let value = a[key]
		let type = typeof value

		// Proxy returned element in array.
		if (typeof key === 'number') {
			trackGet(a, key)
			return proxyOf(value)
		}

		// Proxy array methods.
		else if (type === 'function') {
			return ArrayProxyMethods[key] ?? a[key]
		}

		// Other properties, like `length`.
		else {
			trackGet(a, '')
			return value
		}
	},

	set(a: any, key: PropertyKey, toValue: any): true {
		let fromValue = a[key]
		a[key] = toValue

		if (fromValue !== toValue) {
			trackSet(a, '')
		}

		return true
	},
}


/** Overwrite array methods. */
const ArrayProxyMethods: any = {

	push(this: any[], ...values: any[]) {
		let result = Array.prototype.push.call(this, ...values)

		if (values.length > 0) {
			trackSet(this, '')
		}

		return result
	},

	unshift(this: any[], ...values: any[]) {
		let result = Array.prototype.unshift.call(this, ...values)

		if (values.length > 0) {
			trackSet(this, '')
		}

		return result
	},

	pop(this: any[]) {
		let count = length
		let result = Array.prototype.pop.call(this)

		if (count > 0) {
			trackSet(this, '')
		}

		return result
	},

	shift(this: any[]) {
		let count = length
		let result = Array.prototype.shift.call(this)

		if (count > 0) {
			trackSet(this, '')
		}

		return result
	},

	splice(this: any[], fromIndex: number, removeCount: number, ...insertValues: any[]) {
		let result = Array.prototype.splice.call(this, fromIndex, removeCount, insertValues)

		if (removeCount > 0 || insertValues.length > 0) {
			trackSet(this, '')
		}

		return result
	},

	reverse(this: any[]) {
		let result = Array.prototype.reverse.call(this)
		trackSet(this, '')
		
		return result
	},
}



/** For map proxy. */
const MapProxyHandler = {

	get(a: any, key: PropertyKey): ProxyOf<any> {
		let value = a[key]

		// Proxy get type.
		if (key === 'has' || key === 'get' || key === 'size') {
			trackGet(a, '')
		}

		// Proxy set type.
		else if (key === 'set' || key === 'delete' || key === 'clear') {
			trackSet(a, '')
		}

		return value
	},
}


/** For set proxy. */
const SetProxyHandler = {

	get(a: any, key: PropertyKey): ProxyOf<any> {
		let value = a[key]

		// Proxy get type.
		if (key === 'has' || key === 'size') {
			trackGet(a, '')
		}

		// Proxy set type.
		else if (key === 'add' || key === 'delete' || key === 'clear') {
			trackSet(a, '')
		}

		return value
	},
}