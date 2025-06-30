/** Returns a new list from picking unique items from `list` and removing duplicate items. */
export function unique<T>(list: Iterable<T>): T[] {
	let set: Set<T> = new Set(list)
	return [...set]
}


/** Creates a list composed of all the unique values from given `lists`. */
export function union<T>(...lists: Iterable<T>[]): T[] {
	let set: Set<T> = new Set()

	for (let list of lists) {
		for (let item of list) {
			set.add(item)
		}
	}

	return [...set]
}


/** Creates a list from picking intersected values that are included in all the given `lists`. */
export function intersect<T>(...lists: Iterable<T>[]): T[] {
	let intersect: T[] = []

	if (!lists.length) {
		return intersect
	}

	let map: Map<T, number> = new Map()

	for (let item of lists[0]) {
		map.set(item, 1)
	}

	for (let i = 1; i < lists.length; i++) {
		for (let item of lists[i]) {
			if (map.has(item)) {
				map.set(item, map.get(item)! + 1)
			}
		}
	}

	for (let [item, count] of map.entries()) {
		if (count === lists.length) {
			intersect.push(item)
		}
	}
	
	return intersect
}


/** Creates a new list from picking items from `list` and excluding items inside any one of `excludeLists`. */
export function difference<T>(list: Iterable<T>, ...excludeLists: Iterable<T>[]): T[] {
	let set: Set<T> = new Set(list)

	for (let difArray of excludeLists) {
		for (let item of difArray) {
			set.delete(item)
		}
	}

	return [...set]
}



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


/** Clean list by removing null or undefined values. */
export function clean<T>(list: T[]): NonNullable<T>[] {
	return list.filter(v => v !== null && v !== undefined) as NonNullable<T>[]
}


/**
 * Removes the first item from `list` which matches `match`, returns the removed values.
 * Returns `undefined` if no item removed.
 */
export function removeFirstMatch<T>(list: T[], match: (item: T, index: number) => boolean): T | undefined {
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


/** Map an iterable to another iterable by lazily convert it by a map function. */
export function* lazyMap<T, V>(list: Iterable<T>, map: (value: T) => V): Iterable<V> {
	for (let item of list) {
		yield map(item)
	}
}


/** 
 * Create an index map in `K => V` format.
 * @param pairFn get key and value pair by it.
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
 * @param pairFn get key and value pair by it.
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

/** Extract sortable keys from type `T`. */
export type OrderKey<T> = T extends object ? keyof T & (string | number) : never;

/** Order key or function, or `[order key or function, order direction]` tuple. */
export type OrderRule<T> = {

	/** Order by key or a function. */
	by: OrderKey<T> | OrderFunction<T>

	/** Sort direction. */
	direction?: OrderDirection

	/** 
	 * Whether enables numeric sorting.
	 * Can only apply on string type data value.
	 * Default value is false.
	 */
	numeric?: boolean

	/** 
	 * Whether disables case sensitivity.
	 * Can only apply on string type data value.
	 */
	ignoreCase?: boolean
}

/** Order Rule after normalized. */
type NormativeOrderRule<T> = {
	fn: OrderFunction<T>
	direction: -1 | 1
	numeric: boolean
	ignoreCase: boolean
}


/**
 * Compare with quick helper function `orderBy`,
 * an `Order` class can normalize and sorting parameters and reuse it later.
 */
export class Order<T> {

	/** 
	 * Order rules after normalize.
	 * If several orders exist, try to sort by first order, if equals, sort by next...
	 * It can be re-join with other orders to make a new `Order`.
	 */
	readonly orders: NormativeOrderRule<T>[] = []

	constructor(...orders: OrderRule<T>[]) {
		for (let order of orders) {
			if (typeof order === 'object') {
				this.orders.push({
					fn: this.normalizeOrderKey(order.by), 
					direction: this.normalizeOrderDirection(order.direction),
					numeric: order.numeric ?? false,
					ignoreCase: order.ignoreCase ?? false,
				})
			}
			else {
				this.orders.push({
					fn: this.normalizeOrderKey(order), 
					direction: 1,
					numeric: false,
					ignoreCase: false,
				})
			}
		}
	}

	private normalizeOrderKey(keyOrFn: OrderKey<T> | OrderFunction<T>): OrderFunction<T> {
		if (typeof keyOrFn === 'string' || typeof keyOrFn === 'number') {
			return ((item: T) => item[keyOrFn]) as OrderFunction<T>
		}
		else {
			return keyOrFn
		}
	}

	private normalizeOrderDirection(d: OrderDirection | undefined): -1 | 1 {
		if (d === 'asc') {
			return 1
		}
		else if (d === 'desc') {
			return -1
		}
		else {
			return d ?? 1
		}
	}

	/** 
	 * Sort `list` inside it's memory, by current order.
	 * @param direction specifies additional order adjustment.
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
	 * Sort `list` by current order and return a new list.
	 * @param direction specifies additional order adjustment.
	 */
	toSorted(list: T[], direction: OrderDirection = 1): T[] {
		let normalizedDirection = direction === 'asc' ? 1 : direction === 'desc' ? -1 : direction

		if (normalizedDirection === 1) {
			return list.toSorted((a, b) => {
				return this.compare(a, b)
			})
		}
		else {
			return list.toSorted((a, b) => {
				return -this.compare(a, b)
			})
		}
	}

	/**
	 * Compare two items by current order.
	 * Returns one of `0, -1, 1`.
	 */
	compare(a: T, b: T): 0 | -1 | 1 {
		let collators: (Intl.Collator | null)[] = []

		for (let {numeric, ignoreCase} of this.orders) {
			if (numeric || ignoreCase) {
				let collator = new Intl.Collator(undefined, {
					numeric,
					sensitivity: ignoreCase ? 'base' : undefined,
				})

				collators.push(collator)
			}
			else {
				collators.push(null)
			}
		}

		for (let i = 0; i < this.orders.length; i++) {
			let collator = collators[i]
			let {fn, direction} = this.orders[i]
			let ai = fn(a) as string | number
			let bi = fn(b) as string | number

			if (collator) {
				let result = collator.compare(ai as string, bi as string)
				if (result < 0) {
					return -direction as -1 | 1
				}
				else if (result > 0) {
					return direction
				}
			}
			else if (ai < bi) {
				return -direction as -1 | 1
			}
			else if (ai > bi) {
				return direction
			}
		}

		return 0
	}

	/** 
	 * Binary find an insert index from a list, which has been sorted by current `Order`.
	 * And make the list is still in sorted state after inserting the new value.
	 * Returned index is betweens `0 ~ list length`.
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
 * Sort `list` inside it's memory space, by specified orders.
 * Multiple order rules can be specified.
 */
export function orderBy<T>(list: T[], ...orders: OrderRule<T>[]): T[] {
	let order = new Order(...orders)
	order.sort(list)

	return list
}


/** 
 * Sort `list` by specified orders and return a new list.
 * Multiple order rules can be specified.
 */
export function toOrdered<T>(list: T[], ...orders: OrderRule<T>[]): T[] {
	let order = new Order(...orders)
	return order.toSorted(list)
}


/**
 * Returns the index of the minimal value of all the items in list.
 * @param map compare items by this map function.
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
 * Returns the index of the maximum value of all the items in list.
 * Returns `-1` if no items or all values are `-Infinity`.
 * @param map compare items by this map function.
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
 * Returns `null` if no items or all values are `Infinity`.
 * @param map compare items by this map function.
 */
export function minOf<T>(list: ArrayLike<T>, map: (item: T, index: number) => number): T | null {
	let index = minIndex(list, map)
	return index >= 0 ? list[index] : null
}


/** 
 * Find the maximum item in a list, compare items by a `map` function.
 * Returns `null` if no items or all values are `-Infinity`.
 * @param map compare items by this map function.
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
 * @param comparer is used to compare two values.
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
 * @param comparer is used to compare two values.
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
 * @param comparer is used to compare two values.
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
 * @param fn: used to know whether a value is larger or smaller,
 * 	   it returns negative value to move cursor right, and positive value to move cursor left.
 *     You may simply use `v - aFixedValue`.
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
 * @param fn used to know whether a value is larger or smaller,
 * 	   it returns negative value to move right, and positive value to move left.
 */
export function quickBinaryFindLowerInsertIndex<T>(sortedList: ArrayLike<T>, fn: (v: T) => number): number {
	let index = quickBinaryFindInsertIndex(sortedList, fn)

	while (index > 0 && fn(sortedList[index - 1]) === 0) {
		index--
	}

	return index
}


/** 
 * Binary find index of an item from a list, which has been sorted.
 * Returns the found item index, or `-1` if nothing found.
 * 
 * @param fn used to know whether a value is larger or smaller,
 *   it returns negative value to move cursor right, and positive value to move cursor left.
 */
export function quickBinaryFindIndex<T>(sortedList: ArrayLike<T>, fn: (v: T) => number): number {
	if (sortedList.length === 0) {
		return -1
	}

	let firstResult = fn(sortedList[0])

	if (firstResult === 0) {
		return 0
	}
	
	if (firstResult > 0) {
		return -1
	}

	let lastResult = fn(sortedList[sortedList.length - 1])

	if (lastResult === 0) {
		return sortedList.length - 1
	}

	if (lastResult < 0) {
		return -1
	}

	let start = 0
	let end = sortedList.length - 1

	while (start + 1 < end) {
		let center = Math.floor((end + start) / 2)
		let result = fn(sortedList[center])

		if (result === 0) {
			return center
		}
		else if (result < 0) {
			start = center
		}
		else {
			end = center
		}
	}

	return -1
}


/** 
 * Binary find an item from a list, which has been sorted.
 * Returns the found item, or `undefined` if nothing found.
 * 
 * @param fn used to know whether a value is larger or smaller,
 *   it returns negative value to move cursor right, and positive value to move cursor left.
 */
export function quickBinaryFind<T>(sortedList: ArrayLike<T>, fn: (v: T) => number): T | undefined {
	let index = quickBinaryFindIndex(sortedList, fn)
	if (index === -1) {
		return undefined
	}

	return sortedList[index]
}

