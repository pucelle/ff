import {NumberUtils} from "./number"


export namespace ValueListUtils {

	/** Returns a new list from picking unique items from `list` and removing duplicate items. */
	export function unique<T extends number | string>(list: T[]): T[] {
		let set: Set<T> = new Set(list)
		return [...set]
	}


	/** Creates a list composed of all the unique values from given `lists`. */
	export function union<T extends number | string>(...lists: T[][]): T[] {
		let set: Set<T> = new Set()

		for (let list of lists) {
			for (let item of list) {
				set.add(item)
			}
		}

		return [...set]
	}


	/** Creates a list from picking intersected values that are included in all the given `lists`. */
	export function intersect<T extends number | string>(...lists: T[][]): T[] {
		let interset: T[] = []

		if (!lists.length) {
			return interset
		}

		let map: Map<T, number> = new Map()

		for (let item of lists[0]) {
			map.set(item, 1)
		}

		for (let list of lists.slice(1)) {
			for (let item of list) {
				if (map.has(item)) {
					map.set(item, map.get(item)! + 1)
				}
			}
		}

		for (let [item, count] of map.entries()) {
			if (count === lists.length) {
				interset.push(item)
			}
		}
		
		return interset
	}


	/** Creates a new list from picking items from `list` and excluding items inside any one of `excludeLists`. */
	export function difference<T extends number | string>(list: T[], ...excludeLists: T[][]): T[] {
		let set: Set<T> = new Set(list)

		for (let difArray of excludeLists) {
			for (let item of difArray) {
				set.delete(item)
			}
		}

		return [...set]
	}


	/** Returns the sum of all the numberic values in `list`. */
	export function sum(list: number[]): number {
		return list.reduce((v1, v2) => v1 + v2, 0)
	}


	/**
	 * Returns the average value of all the numberic values in `list`.
	 * Returns `NaN` if no items in `list`.
	 */
	export function average(list: number[]): number {
		if (list.length === 0) {
			return NaN
		}

		return sum(list) / list.length
	}


	/**
	 * Returns the index of the minimal value of all the values.
	 * Returns `-1` if no values or all values are `Infinity`.
	 */
	export function minIndex(values: number[]): number {
		let minIndex = -1
		let minValue = Infinity

		for (let i = 0; i < values.length; i++) {
			if (values[i] < minValue) {
				minIndex = i
				minValue = values[i]
			}
		}

		return minIndex
	}


	/**
	 * Returns the index of the maximun value of all the values.
	 * Returns `-1` if no values or all values are `-Infinity`.
	 */
	export function maxIndex(values: number[]): number {
		let maxIndex = -1
		let maxValue = -Infinity

		for (let i = 0; i < values.length; i++) {
			if (values[i] > maxValue) {
				maxIndex = i
				maxValue = values[i]
			}
		}

		return maxIndex
	}


	/** 
	 * Find the minimum value in a list.
	 * Returns `null` if no items or all values are `Infinity`.
	 */
	export function minOf(values: number[]): number | null {
		let index = minIndex(values)
		return index >= 0 ? values[index] : null
	}


	/** 
	 * Find the maximum value in a list.
	 * Returns `null` if no items or all values are `-Infinity`.
	 */
	export function maxOf(values: number[]): number | null {
		let index = maxIndex(values)
		return index >= 0 ? values[index] : null
	}


	/** 
	 * Binary find from a already sorted from lower to upper list,
	 * find a index to insert the new value.
	 * Returned index betweens `0 ~ list length`.
	 * Note when some equal values exist, the returned index prefers upper.
	 */
	export function binaryFindInsertIndex(sorted: number[], toInsert: number): number {
		if (sorted.length === 0) {
			return 0
		}

		if (toInsert < sorted[0]) {
			return 0
		}

		if (toInsert >= sorted[sorted.length - 1]) {
			return sorted.length
		}

		let start = 0
		let end = sorted.length - 1

		while (start + 1 < end) {
			let center = Math.floor((end + start) / 2)
			let centerValue = sorted[center]
	
			if (centerValue <= toInsert) {
				start = center
			}
			else {
				end = center
			}
		}

		// Value at start index always <= `value`, and value at end index always > `value`.
		return end
	}


	/** `binaryFindInsertIndex` prefers upper index, this one prefers lower. */
	export function binaryFindLowerInsertIndex(sorted: number[], toInsert: number): number {
		let index = binaryFindInsertIndex(sorted, toInsert)

		while (index > 0 && sorted[index - 1] === toInsert) {
			index--
		}

		return index
	}

	
	/** 
	 * Binary insert a numeric value to a list, which has been sorted from lower to upper.
	 * After inserted, target list is still in sorted state.
	 * Returns the insert index.
	 * Uses `array.splice` to do inserting so watch the performance.
	 */
	export function binaryInsert(sorted: number[], toInsert: number): number {
		let index = binaryFindInsertIndex(sorted, toInsert)
		sorted.splice(index, 0, toInsert)
		return index
	}


	/** Binary find a numeric value from a list, which has been sorted from lower to upper. */
	export function binaryFind(sorted: number[], value: number): number | undefined {
		let index = binaryFindInsertIndex(sorted, value)
		if (index === sorted.length) {
			return undefined
		}

		if (sorted[index] === value) {
			return sorted[index]
		}

		return undefined
	}

	
	/** 
	 * Make a list of numbers from `start` to `end` (but not include `end`), with specified `step`.
	 * - `end`: The last number of the returned list is always lower than `end`.
	 * - `step`: default value is `1`.
	 */
	export function *range(start: number, end: number, step: number = 1): Iterable<number> {
		let flag = NumberUtils.flag(step)
		if (flag === 0) {
			throw new RangeError(`"step" must not be zero!`)
		}
		
		for (let i = start; i * flag < end * flag; i += step) {
			yield i
		}
	}
}