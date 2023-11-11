import {DependencyCapturer} from './dependency-capturer'


type Target = object
type Proxied = object


/** To find proxied object. */
const {onGet, onSet} = DependencyCapturer
const ProxySymbol = Symbol()
const SubSymbolMap = new DependencyCapturer.SubDepedencyMap()


/** 
 * Proxy an object or an array, returns the proxied content.
 * Multiple times proxy a same object will always return the same output.
 */
export function proxyOf(v: any): Proxied {
	if (!v || typeof v !== 'object') {
		return v
	}

	return proxyObject(v)
}


/** Proxy an object. */
function proxyObject(o: Target | Proxied | any): Proxied {

	// May become a proxied object already.
	if (ProxySymbol in o) {
		return o[ProxySymbol] as Proxied
	}

	let proxy: any

	if (Array.isArray(o)) {
		proxy = proxyArray(o)
	}
	else {
		proxy = proxyPlainObject(o)
	}

	o[ProxySymbol] = proxy

	return proxy
}


/** Proxy an plain object. */
function proxyPlainObject(o: Target): Proxied {
	return new Proxy(o, PlainObjectProxyHandler)
}


/** Proxy an array. */
function proxyArray(a: Target): Proxied {
	return new Proxy(a, ArrayProxyHandler)
}


/** For observing plain object. */
const PlainObjectProxyHandler = {

	get(o: Target | any, key: PropertyKey): Proxied {
		onGet(SubSymbolMap.get(o, key))
		return proxyOf(o[key])
	},

	set(o: Target | any, key: PropertyKey, toValue: any): true {
		let fromValue = o[key]
		o[key] = toValue

		if (fromValue !== toValue) {
			onSet(SubSymbolMap.get(o, key))
		}

		return true
	},

	deleteProperty(o: any, key: PropertyKey): boolean {
		let result = delete o[key]
		if (result) {
			onSet(SubSymbolMap.get(o, key))
		}

		return result
	}
}


/** For array proxy. */
const ArrayProxyHandler = {

	get(a: Target | any, key: PropertyKey): Proxied {
		let value = a[key]
		let type = typeof value

		// Proxy returned element in array.
		if (typeof key === 'number') {
			onGet(a)
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

	set(a: Target | any, key: PropertyKey, toValue: any): true {
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
