/**
 * Returns the array of `value` repeat for `count` times.
 * @param item The value to repeat.
 * @param count Count of times to repeat.
 */
export function repeatTimes<T>(item: T, count: number): T[] {
	let items: T[] = []

	for (let i = 0 ; i < count; i++) {
		items.push(item)
	}

	return items
}


/**
 * Add items to `array`, duplicate items will not be added.
 * @param array The array to add items.
 * @param items The items to add to array.
 */
export function add<T>(array: T[], ...items: T[]): T[] {
	for (let item of items) {
		if (!array.includes(item)) {
			array.push(item)
		}
	}

	return array
}


/**
 * Remove items from `array`. Returns the removed items.
 * @param array The array to remove items.
 * @param items The items removed from array.
 */
export function remove<T>(array: T[], ...items: T[]): T[] {
	let removed = []

	for (let item of items) {
		let index = array.indexOf(item)

		if (index > -1) {
			removed.push(...array.splice(index, 1))
		}
	}

	return removed
}


/**
 * Remove the first item which match `fn` from `array`. Returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
export function removeFirst<T>(array: T[], fn: (item: T, index: number) => boolean): T | undefined {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn(array[i], i)) {
			return array.splice(i, 1)[0]!
		}
	}

	return undefined
}


/**
 * Remove all the items match `fn` from `array`. Returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
export function removeWhere<T>(array: T[], fn: (item: T, index: number) => boolean): T[] {
	let removed = []

	for (let i = 0; i < array.length; i++) {
		if (fn(array[i], i)) {
			removed.push(array.splice(i--, 1)[0])
		}
	}

	return removed
}


/**
 * Returns a new array from `array` but removes duplicate items.
 * @param array The array to remove duplicate items.
 */
export function unique<T extends number | string>(array: T[]): T[] {
	let set: Set<T> = new Set(array)
	return [...set]
}


/**
 * Creates an array composed of all the unique values from given `arrays`.
 * @param arrays The arrays to get union from.
 */
export function union<T extends number | string>(...arrays: T[][]): T[] {
	let set: Set<T> = new Set()

	for (let array of arrays) {
		for (let item of array) {
			set.add(item)
		}
	}

	return [...set]
}


/**
 * Creates an array of unique values that are included in all given arrays.
 * @param arrays The arrays to get intersection from.
 */
export function intersect<T extends number | string>(...arrays: T[][]): T[] {
	let interset: T[] = []

	if (!arrays.length) {
		return interset
	}

	let map: Map<T, number> = new Map()

	for (let item of arrays[0]) {
		map.set(item, 1)
	}

	for (let array of arrays.slice(1)) {
		for (let item of array) {
			if (map.has(item)) {
				map.set(item, map.get(item)! + 1)
			}
		}
	}

	for (let [item, count] of map.entries()) {
		if (count === arrays.length) {
			interset.push(item)
		}
	}
	
	return interset
}


/**
 * Creates a new array from given `array` but exclude items in `excludeArrays`.
 * @param array The array to include items.
 * @param excludeArrays The arrays to exclude items from.
 */
export function difference<T extends number | string>(array: T[], ...excludeArrays: T[][]): T[] {
	let set: Set<T> = new Set(array)

	for (let difArray of excludeArrays) {
		for (let item of difArray) {
			set.delete(item)
		}
	}

	return [...set]
}


/**
 * Using binary algorithm to find one item from a sorted array which match `fn`.
 * @param array The sorted array.
 * @param fn The function to accept item in array as argument and returns `-1` to move left, `1` to move right.
 */
export function binaryFind<T>(array: T[], fn: (item: T) => (0 | -1 | 1)): T | undefined {
	let index = binaryFindIndex(array, fn)
	return index === -1 ? undefined : array[index]
}


/**
 * Using binary algorithm to find index from a sorted array at where the item match `fn`.
 * @param array The sorted array.
 * @param fn The function to accept item in array as argument and returns `-1` to move left, `1` to move right.
 */
export function binaryFindIndex<T>(array: T[], fn: (item: T) => (0 | -1 | 1)): number {
	if (array.length === 0) {
		return -1
	}

	let result = fn(array[0])
	if (result === 0) {
		return 0
	}
	if (result === -1) {
		return -1
	}

	if (array.length === 1) {
		return -1
	}

	result = fn(array[array.length - 1])
	if (result === 0) {
		return array.length - 1
	}
	if (result === 1) {
		return -1
	}

	let start = 0
	let end = array.length - 1

	while (end - start > 1) {
		let center = Math.floor((end + start) / 2)
		let result = fn(array[center])

		if (result === 0) {
			return center
		}
		else if (result === -1) {
			end = center
		}
		else {
			start = center
		}
	}

	return -1
}


/**
 * Using binary algorithm to find the closest index from a sorted array in where to insert new item and keep order.
 * Returned index betweens `0 ~ array.length`, and if `array[index]` exist, `fn(array[index]) >= 0`.
 * @param array The sorted array.
 * @param fn The function to accept item in array as argument and returns `-1` to move left, `1` to move right.
 */
export function binaryFindIndexToInsert<T>(array: T[], fn: (item: T) => (0 | -1 | 1)): number {
	if (array.length === 0) {
		return 0
	}

	let result = fn(array[0])
	if (result === 0 || result === -1) {
		return 0
	}
	if (array.length === 1) {
		return 1
	}

	result = fn(array[array.length - 1])
	if (result === 0) {
		return array.length - 1
	}
	if (result === 1) {
		return array.length
	}

	let start = 0
	let end = array.length - 1

	while (end - start > 1) {
		let center = Math.floor((end + start) / 2)
		let result = fn(array[center])

		if (result === 0) {
			return center
		}
		else if (result === -1) {
			end = center
		}
		else {
			start = center
		}
	}

	return end
}


export type OrderDirection = -1 | 1 | 'asc' | 'desc'
export type OrderFunction<T> = (item: T) => string | number
export type OrderTuple<T, K> = K | OrderFunction<T> | [K | OrderFunction<T>, OrderDirection]
type NormativeOrderTuple<T, Key> = [Key | OrderFunction<T>, -1 | 1]
type CanSortKeys<T> = Extract<keyof T, string | number>


export class Order<T> {

	private orders: NormativeOrderTuple<T, string | number>[] = []

	/**
	 * Create an order rule, used in `orderBy`, and can also be used to binary search from or binary insert into array with object type items
	 * @param orders Rest arguments of type `key` or `OrderFunction` which will return a `key`, or [`key` / `OrderFunction`, `OrderDirection`].
	 */
	constructor(firstOrder: OrderTuple<T, string | number>, ...orders: OrderTuple<T, string | number>[]) {
		for (let order of [firstOrder, ...orders]) {
			if (['string', 'number', 'function'].includes(typeof order)) {
				this.orders.push([order as any, 1])
			}
			else if (Array.isArray(order) && ['string', 'number', 'function'].includes(typeof order[0])) {
				this.orders.push([order[0], order[1] === -1 || order[1] === 'desc' ? -1 : 1])
			}
			else {
				throw new Error(JSON.stringify(orders) + ' doesn\'t specify any valid key or order.')
			}
		}
	}

	/**
	 * Sort `array` inside by the order specified by current object.
	 * @param array The array to sort.
	 */
	sortArray(array: T[]) {
		array.sort((a, b) => this.compare(a, b))
	}

	/**
	 * Compare two items.
	 * When `order` is `1`: returns `0` if they are same; returns `-1` if the first one less that the second one; else returns `1`.
	 * When `order` is `-1`: returns `0` if they are same; returns `1` if the first one less that the second one; else returns `-1`.
	 * @param a First item.
	 * @param b Second item.
	 */
	compare(a: T, b: T): 0 | -1 | 1 {
		for (let [keyOrFn, order] of this.orders) {
			let ai: number | string
			let bi: number | string

			if (typeof keyOrFn === 'function') {
				ai = keyOrFn(a)
				bi = keyOrFn(b)
			}
			else {
				ai = (a as any)[keyOrFn] as number | string
				bi = (b as any)[keyOrFn] as number | string
			}

			if (ai < bi) {
				return -order as -1 | 1
			}

			if (ai > bi) {
				return order
			}

			if (ai !== bi) {
				return ai === null || ai === undefined ? -order as -1 | 1 : order
			}
		}

		return 0
	}

	/**
	 * Binary find the index of `array` the value at where equals to `item`.
	 * Returns `-1` if not found.
	 * @param array The array to lookup.
	 * @param item The item to search.
	 */
	binaryFind(array: T[], item: T): T | undefined {
		return binaryFind(array, i => this.compare(item, i))
	}

	/**
	 * Binary find an index of `array` to insert `item` and keep current order.
	 * Returned value betweens `0 ~ array.length`.
	 * @param array The array to lookup.
	 * @param item The item to compare.
	 */
	binaryFindIndex(array: T[], item: T): number {
		return binaryFindIndex(array, i => this.compare(item, i))
	}
	
	/**
	 * Binary insert an `item` into `array` and keep current order.
	 * @param array The array to lookup.
	 * @param item The item to insert.
	 */

	// `splice` is very slower since it reallocate memory frequently.
	// See https://jsperf.com/splice-vs-filter
	binaryInsert(array: T[], item: T) {
		let index = binaryFindIndexToInsert(array, i => this.compare(item, i))
		array.splice(index, 0, item)
		return array
	}
}


/**
 * Sort object type items inside array by instantiated `ff.Order` object.
 * @param array The array to order.
 * @param order instantiated `ff.Order`.
 */
export function orderBy<T extends object>(array: T[], order: Order<T>): T[]

/**
 * Sort items of object type inside array by a specified orders.
 * @param array The array to order.
 * @param orders Rest argument of type `key` or `OrderFunction` which will return a `key`, or [`key` / `OrderFunction`, `OrderDirection`].
 */
/*
why `export function orderBy<T extends object, Key extends CanSortKeys<T>>...` not works:
when <Key> appears multiple times at contexual, <Key> was inferred from multiple condidate types

`orderBy([{a:1,b:2}], ['a', 1], 'b')` =>
	contextual	candidate type	priority
	['a', 1]    'a'				0
	'b'			'b'				1

	lower priority value `1` will be overwrited
*/
export function orderBy<T extends object>(array: T[], ...orders: OrderTuple<T, CanSortKeys<T>>[]): T[]

export function orderBy<T extends object>(array: T[], order: Order<T> | OrderTuple<T, CanSortKeys<T>>, ...orders: OrderTuple<T, CanSortKeys<T>>[]): T[] {
	order = order instanceof Order ? order : new Order(order, ...orders)
	order.sortArray(array)
	return array
}


/**
 * Create a map object from `[key, value]` touples returned from `fn`.
 * @param array The array to generate map object.
 * @param fn The function to return `[key, value]` tuple for each item.
 */
export function indexBy<T, V>(array: T[], fn: (value: T, index: number) => [string | number, V]): {[key: string]: V}

/**
 * Create a map object as `{item[key]: item}` format.
 * @param array The array to generate map object.
 * @param key The key of items in array to get value as index keys.
 */
export function indexBy<T, K>(array: T[], key: K): {[key: string]: T}

// Compar to map, object has same performance, and is more convinent to use, but will lose number key type.
export function indexBy<T>(array: T[], keyOrFn: keyof T | ((value: T, index: number) => [string | number, any])): {[key: string]: any} {
	let index: {[key: string]: any} = {}

	if (typeof keyOrFn === 'function') {
		for (let i = 0, len = array.length; i < len; i++) {
			let item = array[i]
			let [key, value] = keyOrFn(item, i)
			index[key] = value
		}
	}
	else {
		for (let item of array) {
			let key = item[keyOrFn] as unknown as string
			index[key] = item
		}
	}

	return index
}


/**
 * Creates a map object composed of keys as running `keyOrFn` on each item, and values as item array share the same key.
 * @param array The array to group by. 
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 */
export function groupBy<T>(array: T[], keyOrFn: CanSortKeys<T> | OrderFunction<T>): {[key: string]: T[]} {
	let index: {[key: string]: T[]} = {}

	for (let item of array) {
		let key: string | number

		if (typeof keyOrFn === 'function') {
			key = keyOrFn(item)
		}
		else {
			key = item[keyOrFn] as unknown as string | number
		}

		let group = index[key] || (index[key] = [])
		group.push(item)
	}

	return index
}


/**
 * Group and aggregate items in array by group function and aggregate function.
 * @param array The array to aggregate. 
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 * @param aggregateFn The aggregate function which accepts grouped items and key as arguments, and returns aggregate value.
 */
export function aggregate<T, Value>(array: T[], keyOrFn: CanSortKeys<T> | OrderFunction<T>, aggregateFn: (items: T[], key?: string) => Value): {[key: string]: Value} {
	let index = groupBy(array, keyOrFn)

	return indexBy(Object.keys(index), (key: string) => {
		return [key, aggregateFn(index[key], key)]
	})
}


/**
 * Returns the length of the array.
 * @param array The array to count length.
 */
// Can't use `array: unknown` here, or it will cause `T` in `aggregate` was inferred as `unknown` and make `CanSortKeys<T>` not working.
export function count(array: any[]): number {
	return array.length
}


/**
 * Returns the sum of all the numbers in `array`.
 * @param array The array of numbers.
 */
export function sum(array: number[]): number {
	return array.reduce((v1, v2) => v1 + v2, 0)
}


/**
 * Returns the average value of the numbers in `array`. Returns 0 if no items in `array`.
 * @param array The array of numbers.
 */
export function avg(array: number[]): number {
	if (array.length === 0) {
		return 0
	}
	return sum(array) / array.length
}


/**
 * Returns the minimal value of the numbers in `array`. Returns `Infinity` if no items in `array`.
 * @param array The array of numbers.
 */
export function min(array: number[]) {
	return Math.min(...array)
}


/**
 * Returns the maximun value of numbers in `array`. Returns `-Infinity` if no items in `array`.
 * @param array The array of numbers.
 */
export function max(array: number[]) {
	return Math.max(...array)
}


/**
 * Returns the index of the minimal value of the array items. Returns `-1` if no items or all values are `Infinity`.
 * @param array The array of data items.
 * @param map The map function to map each item to a number.
 */
export function minIndex<T>(array: T[], map?: (item: T, index: number) => number) {
	let values: number[]

	if (map) {
		values = array.map(map)
	}
	else {
		values = array as unknown as number[]
	}

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
 * Returns the index of the maximun value of the array items. returns `-1` if no items or all values are `-Infinity`.
 * @param array The array of data items.
 * @param map The map function to map each item to a number.
 */
export function maxIndex<T>(array: T[], map?: (item: T, index: number) => number) {
	let values: number[]

	if (map) {
		values = array.map(map)
	}
	else {
		values = array as unknown as number[]
	}

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