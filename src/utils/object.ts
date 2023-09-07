/** Object that can be compared. */
interface Comparable {
	equals(value: any): boolean
}

/** Object that can be cloned. */
interface Cloneable {
	clone(): Cloneable
}


export namespace ObjectUtils {

	/** Deeply clone an JSON object. */
	export function deepClone<T> (source: T, maxDepth: number = 10): T {
		if (typeof source !== 'object' || !source || maxDepth === 0) {
			return source
		}

		// Array.
		if (Array.isArray(source)) {
			return (source as any[]).map(value => {
				if (typeof value !== 'object' || !value) {
					return value
				}
				else {
					return deepClone(value, maxDepth - 1)
				}
			}) as unknown as T
		}

		// Plain object.
		else {
			let cloned: any = {}

			for (let key of Object.keys(source)) {
				let value = (source as any)[key]
				cloned[key] = deepClone(value, maxDepth - 1)
			}

			return cloned as unknown as T
		}
	}


	/** Deeply clone an JSON object, or a cloneable object, which implements `{clone(...)}`. */
	export function deepCloneClonable<T> (source: T, maxDepth: number = 10): T {
		if (typeof source !== 'object' || !source || maxDepth === 0) {
			return source
		}

		// Cloneable `{clone}`.
		if ((source as unknown as Cloneable).clone) {
			return (source as unknown as Cloneable).clone() as unknown as T
		}

		// Plain object.
		else {
			return deepClone(source, maxDepth)
		}
	}


	/** Deeply compare two JSON objects. */
	export function deepCompare(a: unknown, b: unknown, maxDepth: number = 10): boolean {
		if (a === b) {
			return true
		}

		if (maxDepth === 0) {
			return false
		}

		if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
			return false
		}

		// Array.
		if (Array.isArray(a) && Array.isArray(b)) {
			if (a.length !== b.length) {
				return false
			}
			
			return a.every((ai, index) => {
				return deepCompare(ai, b[index], maxDepth - 1)
			})
		}

		// Plain object.
		else {
			let keysA = Object.keys(a)
			let keysB = Object.keys(b)
			
			if (keysA.length !== keysB.length) {
				return false
			}

			for (let key of keysA) {
				let valueA = (a as any)[key]
				let valueB = (b as any)[key]

				if (!deepCompare(valueA, valueB, maxDepth - 1)) {
					return false
				}
			}

			return true
		}
	}


	/** Deeply compare two JSON object, or a comparable object, which implements `{equals(...)}`. */
	export function deepCompareComparable(a: unknown, b: unknown, maxDepth: number = 10): boolean {
		if (a === b) {
			return true
		}

		if (maxDepth === 0) {
			return false
		}

		if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) {
			return false
		}

		// Compare `{equals}`.
		if ((a as Comparable).equals && (a as Comparable).equals(b)) {
			return true
		}

		// Plain object.
		else {
			return deepCompare(a, b, maxDepth)
		}
	}


	/**
	 * Assign keys and values from `source` to `target`.
	 * will cover same keys values of `target`.
	 * will ignore `undefined` values in `source`.
	 */
	export function assign<T extends object, S extends object>(target: T, source: S, keys: (keyof S)[] = Object.keys(source) as (keyof S)[]): T & S {
		for (let key of keys) {
			let value = source[key]
			if (value !== undefined) {
				target[key as unknown as keyof T] = value as any
			}
		}

		return target as T & S
	}


	/** Deeply assign keys and values from `source` to `target`. */
	export function deepAssign<T extends object>(target: T, source: T, maxDepth: number = 10): T {
		if (typeof source !== 'object' || typeof target !== 'object' || !source || !target) {
			return target
		}

		if (maxDepth === 0) {
			return target
		}

		for (let key of Object.keys(source)) {
			let fromValue = (source as any)[key]
			let toValue = (target as any)[key]

			if (typeof toValue === 'object' && toValue) {
				(target as any)[key] = deepAssign(deepClone(toValue), fromValue, maxDepth - 1)
			}
			else {
				(target as any)[key] = deepClone(fromValue)
			}
		}

		return target
	}


	/** 
	 * Assign keys and values from `from` to `target`,
	 * will not overwrite values in `target` if `target` already has relevant keys.
	 * Can specify `keys` to only overwrite by these keys.
	 */
	export function assignNonExisted<T extends object, S extends object>(
		target: T,
		from: S,
		keys: (keyof S)[] = Object.keys(from) as (keyof S)[]
	): T & S
	{
		for (let key of keys) {
			let value = from[key]
			if (value !== undefined && target[key as unknown as keyof T] === undefined) {
				target[key as unknown as keyof T] = value as any
			}
		}

		return target as T & S
	}


	/** 
	 * Assign object values from `from` to `target`,
	 * will only overwrite values that alreayd exist in `target`.
	 * Can specify `keys` to only overwrite by these keys.
	 * Returns whether assigned.
	 */
	export function assignExisted<T extends object>(
		target: T,
		from: Partial<T>,
		keys: (keyof T)[] = Object.keys(target) as (keyof T)[]
	): boolean
	{
		let assigned = false

		for (let key of keys) {
			let value = from[key]
			if (value !== undefined && value !== target[key]) {
				target[key] = value!
				assigned = true
			}
		}

		return assigned
	}


	/** Clear all keys which relevent values are `null` or `undefined`. */
	export function cleanEmptyValues<T extends object>(o: T): T {
		if (!o) {
			return o
		}

		for (let key of Object.keys(o) as (keyof T)[]) {
			if (o[key] === null || o[key] === undefined) {
				delete o[key]
			}
		}

		return o
	}


	/** Convert a map to an object with same key and value pairs. */
	export function mapToObject<K extends string | number, V>(map: Map<K, V>): Record<K, V> {
		let o: Record<K, V> = {} as any

		for (let [k, v] of map.entries()) {
			o[k] = v
		}

		return o
	}
}