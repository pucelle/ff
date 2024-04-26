/** Repeat an item for multiple times, returns the list filled with the repeated items. */
export function repeatForTimes<T>(item: T, count: number): T[] {
	let items: T[] = []

	for (let i = 0; i < count; i++) {
		items.push(item)
	}

	return items
}


/**
 * Add `items` to a `list`, duplicate values that is existed will not be added.
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
 * Removes the first item from `list` which matches `match`, returns the removed values.
 * Returns `undefined` if no item removed.
 */
export function removeFirst<T>(list: T[], match: (item: T, index: number) => boolean): T | undefined {
	for (let i = list.length - 1; i >= 0; i--) {
		if (match(list[i], i)) {
			return list.splice(i, 1)[0]!
		}
	}

	return undefined
}


/** Remove all the items in `list` which matches `match`, returns the removed values. */
export function removeWhere<T>(list: T[], match: (item: T, index: number) => boolean): T[] {
	let removed = []

	for (let i = 0; i < list.length; i++) {
		if (match(list[i], i)) {
			removed.push(list.splice(i--, 1)[0])
		}
	}

	return removed
}


/** 
 * Create an index map in `K => V` format.
 * - `pairFn`: get key and value pair by it.
 */
export function indexBy<T, K, V>(list: Iterable<T>, pairFn: (value: T) => [K, V]): Map<K, V> {
	let map: Map<K, V> = new Map()

	for (let item of list) {
		let [key, value] = pairFn(item)
		map.set(key, value)
	}

	return map
}


/** 
 * Create a group map in `K => V[]` format, just like SQL `group by` statement.
 * - `pairFn`: get key and value pair by it.
 */
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


/** Ordering direction, `-1` to sort items from larger to smaller, while `1` to sort items from smaller to larger. */
export type OrderDirection = -1 | 1 | 'asc' | 'desc'

/** Ordering function that map each item to a sortable string or number. */
export type OrderFunction<T> = (item: T) => string | number | null | undefined

/** Order key or function, or `[order key or function, order direction]` tuple. */
export type OrderRule<T> = SortableKey<T> | OrderFunction<T> | [SortableKey<T> | OrderFunction<T>, OrderDirection]

/** Extract sortable keys from type `T`. */
export type SortableKey<T> = T extends object ? keyof T & (string | number) : never;

/** `[order key or function, order direction -1 or 1]` tuple. */
type NormativeOrderRules<T> = {fn: OrderFunction<T>, direction: -1 | 1}


/**
 * Compare with quick helper function `orderBy`,
 * an `Order` class can normalize and sorting parameters and resue it later.
 */
export class Order<T> {

	/** Order rules after normalize. */
	private orders: NormativeOrderRules<T>[] = []

	constructor(...orders: OrderRule<T>[]) {
		for (let order of orders) {
			if (Array.isArray(order)) {
				this.orders.push({
					fn: this.normalizeOrderKey(order[0]), 
					direction: this.normalizeOrderDirection(order[1]),
				})
			}
			else {
				this.orders.push({
					fn: this.normalizeOrderKey(order), 
					direction: 1,
				})
			}
		}
	}

	private normalizeOrderKey(keyOrFn: SortableKey<T> | OrderFunction<T>): OrderFunction<T> {
		if (typeof keyOrFn === 'string' || typeof keyOrFn === 'number') {
			return ((item: T) => item[keyOrFn]) as OrderFunction<T>
		}
		else {
			return keyOrFn
		}
	}

	private normalizeOrderDirection(d: OrderDirection): -1 | 1 {
		if (d === 'asc') {
			return 1
		}
		else if (d === 'desc') {
			return -1
		}
		else {
			return d
		}
	}

	/** 
	 * Sort `list` inside it's memory, by current order.
	 * `direction` specifies additional order adjustment.
	 */
	sort(list: T[], direction: OrderDirection = 1) {
		let normalizedDirection = direction === 'asc' ? 1 : direction === 'desc' ? -1 : direction

		if (normalizedDirection === 1) {
			list.sort((a, b) => {
				return this.compare(a, b)
			})
		}
		else {
			list.sort((a, b) => {
				return -this.compare(a, b)
			})
		}
	}

	/**
	 * Compare two items by current order.
	 * Returns one of `0, -1, 1`.
	 */
	compare(a: T, b: T): 0 | -1 | 1 {
		for (let {fn, direction} of this.orders) {
			let ai = fn(a) as string | number
			let bi = fn(b) as string | number

			if (ai < bi) {
				return -direction as -1 | 1
			}

			if (ai > bi) {
				return direction
			}
		}

		return 0
	}

	/** 
	 * Binary find an insert index from a list, which has been sorted by current `Order`.
	 * And make the list is still in sorted state after inserting the new value.
	 * Returned index is betweens `0 ~ list length`.
	 * 
	 * Note when some equal values exist, the returned index prefers upper.
	 */
	binaryFindInsertIndex(list: T[], item: T): number {
		return binaryFindInsertIndex(list, item, i => this.compare(item, i))
	}

	/** 
	 * Binary find an insert index from a list, which has been sorted by current `Order`.
	 * And make the list is still in sorted state after inserting the new value.
	 * Returned index is betweens `0 ~ list length`.
	 * Note when some equal values exist, the returned index prefers lower.
	 */
	binaryFindLowerInsertIndex(list: T[], item: T): number {
		return binaryFindLowerInsertIndex(list, item, i => this.compare(item, i))
	}

	/** 
	 * Binary find an item from a list, which has been sorted by current `Order`.
	 * Returns the found item, or `undefined` if nothing found.
	 */
	binaryFind(list: T[], item: T): T | undefined {
		return binaryFind(list, item, i => this.compare(item, i))
	}
	
	/** 
	 * Binary insert an item from a list, which has been sorted by current `Order`
	 * After inserted, target list is still in sorted state.
	 * Returns the insert index.
	 * Uses `array.splice` to do inserting so watch the performance.
	 */
	binaryInsert(list: T[], item: T): number {
		return binaryInsert(list, item, i => this.compare(item, i))
	}
}


/** 
 * Sort `list` inside it's memory, by specified orders.
 * Multiple order rules can be specified.
 */
export function orderBy<T>(list: T[], ...orders: OrderRule<T>[]): T[] {
	let order = new Order(...orders)
	order.sort(list)

	return list
}


/**
 * Returns the index of the minimal value of all the items in list.
 * - `map`: comparing the minimum item by this map function.
 * 
 * Returns `-1` if no items or all values are `Infinity`.
 */
export function minIndex<T>(list: ArrayLike<T>, map: (item: T, index: number) => number): number {
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
 * - `map`: comparing the minimum item by this map function.
 * 
 * Returns `-1` if no items or all values are `-Infinity`.
 */
export function maxIndex<T>(list: ArrayLike<T>, map: (item: T, index: number) => number): number {
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



/** 
 * Find the minimum item in a list.
 * - `map`: comparing the minimum item by this map function.
 * 
 * Returns `null` if no items or all values are `Infinity`.
 */
export function minOf<T>(list: ArrayLike<T>, map: (item: T, index: number) => number): T | null {
	let index = minIndex(list, map)
	return index >= 0 ? list[index] : null
}


/** 
 * Find the maximum item in a list, comparing the minimum item by a `map` function.
 * - `map`: comparing the minimum item by this map function.
 * 
 * Returns `null` if no items or all values are `-Infinity`.
 */
export function maxOf<T>(list: ArrayLike<T>, map: (item: T, index: number) => number): T | null {
	let index = maxIndex(list, map)
	return index >= 0 ? list[index] : null
}



/** 
 * Binary find an insert index from a list, which has been sorted by `comparer`.
 * And make the list is still in sorted state after inserting the new value.
 * Returned index is betweens `0 ~ list length`.
 * Note when some equal values exist, the returned index prefers upper.
 * `comparer` is used to compare two values.
 */
export function binaryFindInsertIndex<T>(sortedList: ArrayLike<T>, toInsert: T, comparer: (v1: T, v2: T) => number): number {
	if (sortedList.length === 0) {
		return 0
	}

	if (comparer(sortedList[0], toInsert) > 0) {
		return 0
	}

	if (comparer(sortedList[sortedList.length - 1], toInsert) <= 0) {
		return sortedList.length
	}

	let start = 0
	let end = sortedList.length - 1

	while (start + 1 < end) {
		let center = Math.floor((end + start) / 2)
		let result = comparer(sortedList[center], toInsert)

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


/** 
 * Binary find an insert index from a list, which has been sorted by `comparer`.
 * And make the list is still in sorted state after inserting the new value.
 * Returned index is betweens `0 ~ list length`.
 * Note when some equal values exist, the returned index prefers lower.
 * `comparer` is used to compare two values.
 */
export function binaryFindLowerInsertIndex<T>(sortedList: ArrayLike<T>, toInsert: T, comparer: (value: T, compareValue: T) => number): number {
	let index = binaryFindInsertIndex(sortedList, toInsert, comparer)

	while (index > 0 && comparer(toInsert, sortedList[index - 1]) === 0) {
		index--
	}

	return index
}


/** 
 * Binary insert an item to a list, which has been sorted by `comparer`.
 * After inserted, target list is still in sorted state.
 * Returns the insert index.
 * Uses `array.splice` to do inserting so watch the performance.
 */
export function binaryInsert<T>(sortedList: T[], toInsert: T, comparer: (value: T, compareValue: T) => number): number {
	let index = binaryFindInsertIndex(sortedList, toInsert, comparer)
	sortedList.splice(index, 0, toInsert)
	return index
}


/** 
 * Binary find an item from a list, which has been sorted by `comparer`.
 * Returns the found item, or `undefined` if nothing found.
 * `comparer` is used to compare two values.
 */
export function binaryFind<T>(sortedList: ArrayLike<T>, like: T, comparer: (value: T, compareValue: T) => number): T | undefined {
	let index = binaryFindLowerInsertIndex(sortedList, like, comparer)
	if (index === sortedList.length) {
		return undefined
	}

	if (comparer(sortedList[index], like) === 0) {
		return sortedList[index]
	}

	return undefined
}



/** 
 * Binary find an insert index from a list, which has been sorted.
 * And make the list is still in sorted state after inserting the new value.
 * Returned index is betweens `0 ~ list length`.
 * Note when some equal values exist, the returned index prefers upper.
 * 
 * `fn`: used to know whether a value is larger or smaller,
 * it returns positive value to move right,
 * and returns negative value to move left.
 */
export function quickBinaryFindInsertIndex<T>(sortedList: ArrayLike<T>, fn: (v: T) => number): number {
	if (sortedList.length === 0) {
		return 0
	}

	if (fn(sortedList[0]) > 0) {
		return 0
	}

	if (fn(sortedList[sortedList.length - 1]) <= 0) {
		return sortedList.length
	}

	let start = 0
	let end = sortedList.length - 1

	while (start + 1 < end) {
		let center = Math.floor((end + start) / 2)
		let result = fn(sortedList[center])

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


/** 
 * Binary find an insert index from a list, which has been sorted.
 * And make the list is still in sorted state after inserting the new value.
 * Returned index is betweens `0 ~ list length`.
 * Note when some equal values exist, the returned index prefers lower.
 * 
 * `fn`: used to know whether a value is larger or smaller,
 * it returns positive value to move right,
 * and returns negative value to move left.
 */
export function quickBinaryFindLowerInsertIndex<T>(sortedList: ArrayLike<T>, fn: (v: T) => number): number {
	let index = quickBinaryFindInsertIndex(sortedList, fn)

	while (index > 0 && fn(sortedList[index - 1]) === 0) {
		index--
	}

	return index
}


/** 
 * Binary find an item from a list, which has been sorted.
 * Returns the found item, or `undefined` if nothing found.
 * 
 * `fn`: used to know whether a value is larger or smaller,
 * it returns positive value to move right,
 * and returns negative value to move left.
 */
export function quickBinaryFind<T>(sortedList: ArrayLike<T>, fn: (v: T) => number): T | undefined {
	let index = quickBinaryFindLowerInsertIndex(sortedList, fn)
	if (index === sortedList.length) {
		return undefined
	}

	if (fn(sortedList[index]) === 0) {
		return sortedList[index]
	}

	return undefined
}
