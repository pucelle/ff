import {DependencyCapturer} from '../dependency-capturer'


type Target = object
type Proxied = object


/** Proxy must use global symbols. */
const PropertiedSymbolMap = new DependencyCapturer.PropertiedDepedencyMap()
const SymbolMap = new DependencyCapturer.DepedencyMap()

/** To find proxied object. */
const ProxySymbol = Symbol()


/** Observe an object or an array if it is. */
export function observeAny(v: any): Proxied {
	if (!v || typeof v !== 'object') {
		return v
	}

	return observeObject(v)
}


/** Observe an object. */
function observeObject(o: Target | Proxied | any): Proxied {

	// May be already a proxied object.
	if (ProxySymbol in o) {
		return o[ProxySymbol] as Proxied
	}

	let proxy: any

	if (Array.isArray(o)) {
		proxy = observeArray(o)
	}
	else {
		proxy = observePlainObject(o)
	}

	o[ProxySymbol] = proxy

	return proxy
}


/** Observe an plain object. */
function observePlainObject(o: Target): Proxied {
	return new Proxy(o, PlainObjectProxyHandler)
}


/** Observe an array. */
function observeArray(a: Target): Proxied {
	return new Proxy(a, ArrayProxyHandler)
}


/** For observing plain object. */
const PlainObjectProxyHandler = {

	get(o: Target | any, key: PropertyKey): Proxied {
		DependencyCapturer.onGet(PropertiedSymbolMap.get(o, key))
		return observeAny(o[key])
	},

	set(o: Target | any, key: PropertyKey, toValue: any): true {
		let fromValue = o[key]
		o[key] = toValue

		if (fromValue !== toValue) {
			DependencyCapturer.onSet(PropertiedSymbolMap.get(o, key))
		}

		return true
	},

	deleteProperty(o: any, key: PropertyKey): boolean {
		let result = delete o[key]
		if (result) {
			DependencyCapturer.onSet(PropertiedSymbolMap.get(o, key))
		}

		return result
	}
}


/** For observing array. */
const ArrayProxyHandler = {

	get(a: Target | any, key: PropertyKey): Proxied {
		let value = a[key]
		let type = typeof value

		if (key in a) {
			DependencyCapturer.onGet(SymbolMap.get(a))
			return observeAny(value)
		}
		else if (type === 'function') {
			return ArrayProxyMethods[key].bind(a) ?? a[key]
		}

		return value
	},

	set(a: Target | any, key: PropertyKey, toValue: any): true {
		let fromValue = a[key]
		a[key] = toValue

		if (fromValue !== toValue) {
			DependencyCapturer.onSet(SymbolMap.get(a))
		}

		return true
	},
}


/** Overwrite array methods. */
const ArrayProxyMethods: any = {

	push: function(this: any[], ...values: any[]) {
		let result = Array.prototype.push.call(this, ...values)
		
		if (values.length > 0) {
			DependencyCapturer.onSet(SymbolMap.get(this))
		}

		return result
	},

	unshift: function(this: any[], ...values: any[]) {
		let result = Array.prototype.unshift.call(this, ...values)

		if (values.length > 0) {
			DependencyCapturer.onSet(SymbolMap.get(this))
		}

		return result
	},

	pop: function(this: any[]) {
		let count = length
		let result = Array.prototype.pop.call(this)

		if (count > 0) {
			DependencyCapturer.onSet(SymbolMap.get(this))
		}

		return result
	},

	shift: function(this: any[]) {
		let count = length
		let result = Array.prototype.shift.call(this)

		if (count > 0) {
			DependencyCapturer.onSet(SymbolMap.get(this))
		}

		return result
	},

	splice: function(this: any[], fromIndex: number, removeCount: number, ...insertValues: any[]) {
		let result = Array.prototype.splice.call(this, fromIndex, removeCount, insertValues)

		if (removeCount > 0 || insertValues.length > 0) {
			DependencyCapturer.onSet(SymbolMap.get(this))
		}

		return result
	},
}
