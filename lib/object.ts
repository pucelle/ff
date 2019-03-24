interface ObjectWithStringKeys {
	[key: string]: unknown
}


/**
 * Assign values from source to target.
 * @param target The target that the sources assigned to.
 * @param sources The sources that will assigned to target by order.
 * @param keys If `keys` is specified, only values whose key in it can be assigned.
 */
export function assign<T extends {[key: string]: unknown}, S extends {[key: string]: unknown}>(target: T, source: S, keys: (keyof S)[] = Object.keys(source)): T {
	for (let key of keys) {
		let value = source[key]
		if (value !== undefined) {
			target[key as string] = value
		}
	}

	return target
}


// 2x~3x faster than JSON methods, see https://jsperf.com/deep-clone-vs-json-clone
/**
 * Deeply clone an object or value
 * @param source The source to be clone.
 * @param deep Max deep to clone
 */
export function deepClone<T> (source: T, deep: number = 10): T {
	if (typeof source !== 'object' || !source || deep === 0) {
		return source
	}

	if (Array.isArray(source)) {
		return <T><unknown>source.map(value => {
			if (typeof value !== 'object' || !value) {
				return value
			}
			else {
				return deepClone(value, deep - 1)
			}
		})
	}
	else {
		let cloned: ObjectWithStringKeys = {}
		for (let key of Object.keys(source)) {
			let value = (source as ObjectWithStringKeys)[key]
			cloned[key] = deepClone(value, deep - 1)
		}

		return <T>cloned
	}
}


// 1x faster than JSON methods, see https://jsperf.com/deep-equal-vs-json-compare
/**
 * Deeply compare two objects or values
 * @param a left one
 * @param b right one
 * @param deep Max deep to compare
 */
export function deepEqual(a: unknown, b: unknown, deep: number = 10): boolean {
	if (a === b) {
		return true
	}

	if (deep === 0) {
		return false
	}

	if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
		return false
	}

	if (a.constructor !== b.constructor) {
		return false
	}

	let keysA = Object.keys(a)
	let keysB = Object.keys(b)
	
	if (keysA.length !== keysB.length) {
		return false
	}

	for (let key of keysA) {
		if (!b.hasOwnProperty(key)) {
			return false
		}

		let valueA = (a as ObjectWithStringKeys)[key]
		let valueB = (b as ObjectWithStringKeys)[key]

		if (!deepEqual(valueA, valueB, deep - 1)) {
			return false
		}
	}

	return true
}