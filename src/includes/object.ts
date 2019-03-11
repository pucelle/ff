interface ObjectWithStringKeys {
	[key: string]: any
}


//2x~3x faster than JSON methods, see https://jsperf.com/deep-clone-vs-json-clone
/**
 * Deeply clone an object or value
 * @param source Specify the source to be clone.
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
			let value = (<ObjectWithStringKeys>source)[key]
			cloned[key] = deepClone(value, deep - 1)
		}

		return <T>cloned
	}
}


//1x faster than JSON methods, see https://jsperf.com/deep-equal-vs-json-compare
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

		let valueA = (<ObjectWithStringKeys>a)[key]
		let valueB = (<ObjectWithStringKeys>b)[key]

		if (!deepEqual(valueA, valueB, deep - 1)) {
			return false
		}
	}

	return true
}