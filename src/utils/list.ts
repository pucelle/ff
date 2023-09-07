export namespace ListUtils {

	/** Repeat an item for multiple times, returns the list filled with it. */
	export function repeatForTimes<T>(item: T, count: number): T[] {
		let items: T[] = []

		for (let i = 0; i < count; i++) {
			items.push(item)
		}

		return items
	}


	/**
	 * Add `items` to a `list`, but duplicate values will not be added.
	 * Note this method is not fit for adding many items to a list.
	 */
	export function add<T>(list: T[], ...items: T[]): T[] {
		for (let item of items) {
			if (!list.includes(item)) {
				list.push(item)
			}
		}

		return list
	}


	/**
	 * Remove all the `items` from `list`, and returns the removed values.
	 * Note this method uses `splice` to remove values, and only removes each item for once.
	 */
	export function remove<T>(list: T[], ...items: T[]): T[] {
		let removed = []

		for (let item of items) {
			let index = list.indexOf(item)

			if (index > -1) {
				removed.push(...list.splice(index, 1))
			}
		}

		return removed
	}


	/**
	 * Removes the first item from `list` which matches `fn`, returns the removed values.
	 * Returns `undefined` if no item removed.
	 */
	export function removeFirst<T>(list: T[], fn: (item: T, index: number) => boolean): T | undefined {
		for (let i = list.length - 1; i >= 0; i--) {
			if (fn(list[i], i)) {
				return list.splice(i, 1)[0]!
			}
		}

		return undefined
	}


	/** Remove all the items in `list` which match `fn`, returns the removed values. */
	export function removeWhere<T>(list: T[], fn: (item: T, index: number) => boolean): T[] {
		let removed = []

		for (let i = 0; i < list.length; i++) {
			if (fn(list[i], i)) {
				removed.push(list.splice(i--, 1)[0])
			}
		}

		return removed
	}


	/** Create a group map in `K => V[]` format, just like SQL `group by` statement. */
	export function groupBy<T, K, V>(list: Iterable<T>, pairFn: (value: T) => [K, V]): Map<K, V[]> {
		let map: Map<K, V[]> = new Map()

		for (let item of list) {
			let [key, value] = pairFn(item)

			let group = map.get(key)
			if (!group) {
				group = []
				map.set(key, group)
			}

			group.push(value)
		}

		return map
	}


	/** Create an index map in `K => V` format. */
	export function indexBy<T, K, V>(list: Iterable<T>, pairFn: (value: T) => [K, V]): Map<K, V> {
		let map: Map<K, V> = new Map()

		for (let item of list) {
			let [key, value] = pairFn(item)
			map.set(key, value)
		}

		return map
	}


	/**
	 * Returns the index of the minimal value of all the items in list.
	 * Returns `-1` if no items or all values are `Infinity`.
	 */
	export function minIndex<T>(list: T[], map: (item: T, index: number) => number): number {
		let minIndex = -1
		let minValue = Infinity

		for (let i = 0; i < list.length; i++) {
			let value = map(list[i], i)

			if (value < minValue) {
				minIndex = i
				minValue = value
			}
		}

		return minIndex
	}


	/**
	 * Returns the index of the maximun value of all the items in list.
	 * Returns `-1` if no items or all values are `-Infinity`.
	 */
	export function maxIndex<T>(list: T[], map: (item: T, index: number) => number): number {
		let maxIndex = -1
		let maxValue = -Infinity

		for (let i = 0; i < list.length; i++) {
			let value = map(list[i], i)
			if (value > maxValue) {
				maxIndex = i
				maxValue = value
			}
		}

		return maxIndex
	}



	/** Find the minimum item in a list, get the minimum item by a map function. */
	export function minOf<T>(list: T[], map: (item: T, index: number) => number): T | null {
		let index = minIndex(list, map)
		return index >= 0 ? list[index] : null
	}


	/** Find the maximum item in a list, get the minimum item by a map function. */
	export function maxOf<T>(list: T[], map: (item: T, index: number) => number): T | null {
		let index = maxIndex(list, map)
		return index >= 0 ? list[index] : null
	}


	/** 
	 * Binary find from a already sorted from lower to upper list,
	 * find a index to insert the new value.
	 * Returned index betweens `0 ~ list length`.
	 * Note when some equal values exist, the returned index prefers upper.
	 * `mapFn` should return negative value if paramter 1 < parameter 2
	 */
	export function binaryFindInsertIndex<T>(sorted: T[], toInsert: T, mapFn: (v1: T, v2: T) => number): number {
		if (sorted.length === 0) {
			return 0
		}
		else if (mapFn(toInsert, sorted[0]) < 0) {
			return 0
		}
		else if (mapFn(toInsert, sorted[sorted.length - 1]) > 0) {
			return sorted.length
		}
		else {
			let start = 0
			let end = sorted.length - 1

			while (start + 1 < end) {
				let center = Math.floor((end + start) / 2)
				let result = mapFn(sorted[center], toInsert)
		
				if (result <= 0) {
					start = center
				}
				else {
					end = center
				}
			}

			// Value at start index always <= `value`, and value at end index always > `value`.
			return end
		}
	}


	/** `binaryFindInsertIndex` prefers upper index, this one prefers lower. */
	export function binaryFindLowerInsertIndex<T>(sorted: T[], toInsert: T, mapFn: (value: T, compareValue: T) => number): number {
		let index = binaryFindInsertIndex(sorted, toInsert, mapFn)

		while (index > 1 && mapFn(toInsert, sorted[index - 1]) === 0) {
			index--
		}

		return index
	}
}