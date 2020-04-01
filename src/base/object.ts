/**
 * Assign object keys and values from `source` to `target`, will cover values of `target` with same keys.
 * will ignore `undefined` values in `source`.
 * @param target The target that the sources assigned to.
 * @param sources The sources that will assigned to target by order.
 * @param keys If specified, only values whose keys are included will be assigned.
 */
export function assign<T extends object, S extends object>(target: T, source: S, keys: (keyof S)[] = Object.keys(source) as (keyof S)[]): T {
	for (let key of keys) {
		let value = source[key]
		if (value !== undefined) {
			target[key as unknown as keyof T] = value as any
		}
	}

	return target
}


/**
 * Assign object keys and values from `source` to `target`, will not cover values of `target` with existing keys.
 * will ignore `undefined` values in `source`,  and `undefined` values in `target` will be treated as not exist.
 * @param target The target that the sources assigned to.
 * @param sources The sources that will assigned to target by order.
 * @param keys If specified, only values whose keys are included will be assigned.
 */
export function assignIf<T extends object, S extends object>(target: T, source: S, keys: (keyof S)[] = Object.keys(source) as (keyof S)[]): T {
	for (let key of keys) {
		let value = source[key]
		if (value !== undefined && target[key as unknown as keyof T] === undefined) {
			target[key as unknown as keyof T] = value as any
		}
	}

	return target
}


// 2x~3x faster than JSON methods, see https://jsperf.com/deep-clone-vs-json-clone
/**
 * Deeply clone an object, array or any value which can also be called with `JSON.stringify`.
 * @param source The source to clone.
 * @param deep Max deep to clone, default value is 10.
 */
export function deepClone<T> (source: T, deep: number = 10): T {
	if (typeof source !== 'object' || !source || deep === 0) {
		return source
	}

	if (Array.isArray(source)) {
		return source.map(value => {
			if (typeof value !== 'object' || !value) {
				return value
			}
			else {
				return deepClone(value, deep - 1)
			}
		}) as unknown as T
	}
	else {
		let cloned: any = {}
		for (let key of Object.keys(source)) {
			let value = (source as any)[key]
			cloned[key] = deepClone(value, deep - 1)
		}

		return cloned as unknown as T
	}
}


// 1x faster than JSON methods, see https://jsperf.com/deep-equal-vs-json-compare
/**
 * Deeply compare two objects, arraies or any values.
 * @param a Left value.
 * @param b Right value.
 * @param deep Max deep to compare, default value is 10.
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

		let valueA = (a as any)[key]
		let valueB = (b as any)[key]

		if (!deepEqual(valueA, valueB, deep - 1)) {
			return false
		}
	}

	return true
}