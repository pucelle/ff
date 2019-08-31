/**
 * Repeat value for multiple times and returns the array of it.
 * @param item The value to repeat.
 * @param count Count of times to repeat.
 */
export function repeatTimes<Item>(item: Item, count: number): Item[] {
	let items: Item[] = []

	for (let i = 0 ; i < count; i++) {
		items.push(item)
	}

	return items
}


/**
 * Add items to array, for each item in items, will push into array if is not exist in array.
 * @param array The array to add items.
 * @param items The items to add to array.
 */
export function add<Item>(array: Item[], ...items: Item[]): Item[] {
	for (let item of items) {
		if (!array.includes(item)) {
			array.push(item)
		}
	}

	return array
}


/**
 * Remove items from array, returns the actual removed items.
 * @param array The array to remove items.
 * @param items The items to remove from array.
 */
export function remove<Item>(array: Item[], ...items: Item[]): Item[] {
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
 * Remove items match `fn` from array, returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
export function removeFirst<Item>(array: Item[], fn: (item: Item, index: number) => boolean): Item | undefined {
	for (let i = array.length - 1; i >= 0; i--) {
		if (fn(array[i], i)) {
			return array.splice(i, 1)[0]!
		}
	}

	return undefined
}


/**
 * Remove items match `fn` from array, returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
export function removeWhere<Item>(array: Item[], fn: (item: Item, index: number) => boolean): Item[] {
	let removed = []

	for (let i = 0; i < array.length; i++) {
		if (fn(array[i], i)) {
			removed.push(array.splice(i--, 1)[0])
		}
	}

	return removed
}


/**
 * Returns a new array which has been removed duplicate items.
 * @param array The array to remove duplicate items.
 */
export function unique<Item extends number | string>(array: Item[]): Item[] {
	let set: Set<Item> = new Set(array)
	return [...set]
}


/**
 * Creates an array of unique values from given arrays.
 * @param arrays The arrays to get union from.
 */
export function union<Item extends number | string>(...arrays: Item[][]): Item[] {
	let set: Set<Item> = new Set()

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
export function intersect<Item extends number | string>(...arrays: Item[][]): Item[] {
	let interset: Item[] = []

	if (!arrays.length) {
		return interset
	}

	let map: Map<Item, number> = new Map()

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
 * Creates an array from given array but exclude items in excludeArrays.
 * @param array The array to include items.
 * @param excludeArrays The arrays to exclude items from.
 */
export function difference<Item extends number | string>(array: Item[], ...excludeArrays: Item[][]): Item[] {
	let set: Set<Item> = new Set(array)

	for (let difArray of excludeArrays) {
		for (let item of difArray) {
			set.delete(item)
		}
	}

	return [...set]
}


/**
 * Find one item from a sorted array matched `fn`.
 * @param array The sorted array.
 * @param fn The function to accept item in array as argument and returns `-1` to move left, `1` to move right.
 */
export function binaryFind<Item>(array: Item[], fn: (item: Item) => (0 | -1 | 1)): Item | undefined {
	let index = binaryFindIndex(array, fn)
	return index === -1 ? undefined : array[index]
}


/**
 * Find the index in a sorted array in where the item in the index position matched `fn`.
 * @param array The sorted array.
 * @param fn The function to accept item in array as argument and returns `-1` to move left, `1` to move right.
 */
export function binaryFindIndex<Item>(array: Item[], fn: (item: Item) => (0 | -1 | 1)): number {
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
 * Find the closest index in a sorted array in where to insert new item.
 * Returned index betweens `0 - array.length`, and if `array[index]` exist, `fn(array[index]) >= 0`.
 * @param array The sorted array.
 * @param fn The function to accept item in array as argument and returns `-1` to move left, `1` to move right.
 */
export function binaryFindIndexToInsert<Item>(array: Item[], fn: (item: Item) => (0 | -1 | 1)): number {
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
export type OrderFunction<Item> = (item: Item) => string | number
export type OrderTuple<Item, Key> = Key | OrderFunction<Item> | [Key | OrderFunction<Item>, OrderDirection]
type NormativeOrderTuple<Item, Key> = [Key | OrderFunction<Item>, -1 | 1]
type CanSortKeys<Item> = Extract<{[Key in keyof Item]: Item[Key] extends string | number ? Key : never}[keyof Item], string | number>


export class Order<Item> {

	private orders: NormativeOrderTuple<Item, string | number>[] = []

	/**
	 * Create an order rule, used in `orderBy`, and can also be used to binary search from or binary insert into array with object type items
	 * @param orders Rest arguments of type `key` or `OrderFunction` which will return a `key`, or [`key` / `OrderFunction`, `OrderDirection`].
	 */
	constructor(firstOrder: OrderTuple<Item, string | number>, ...orders: OrderTuple<Item, string | number>[]) {
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

	sortArray(array: Item[]) {
		array.sort((a, b) => this.compare(a, b))
	}

	compare(a: Item, b: Item): 0 | -1 | 1 {
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
				return <-1 | 1>-order
			}

			if (ai > bi) {
				return order
			}

			if (ai !== bi) {
				return ai === null || ai === undefined ? <-1 | 1>-order : order
			}
		}

		return 0
	}

	binaryFind(array: Item[], item: Item): Item | undefined {
		return binaryFind(array, i => this.compare(item, i))
	}

	binaryFindIndex(array: Item[], item: Item): number {
		return binaryFindIndex(array, i => this.compare(item, i))
	}
	
	binaryInsert(array: Item[], item: Item) {
		let index = binaryFindIndexToInsert(array, i => this.compare(item, i))
		array.splice(index, 0, item)
	}
}


/**
 * Sort object type items inside array by instantiated `ff.Order` object.
 * @param array The array to order.
 * @param order instantiated `ff.Order`.
 */
export function orderBy<Item extends object>(array: Item[], order: Order<Item>): Item[]

/**
 * Sort object type items inside array by specified orders.
 * @param array The array to order.
 * @param orders Rest argument of type `key` or `OrderFunction` which will return a `key`, or [`key` / `OrderFunction`, `OrderDirection`].
 */
/*
why `export function orderBy<Item extends object, Key extends CanSortKeys<Item>>...` not works:
when <Key> appears multiple times at contexual, <Key> was inferred from multiple condidate types

`orderBy([{a:1,b:2}], ['a', 1], 'b')` =>
	contextual	candidate type	priority
	['a', 1]    'a'				0
	'b'			'b'				1

	lower priority value `1` will be overwrited
*/
export function orderBy<Item extends object>(array: Item[], ...orders: OrderTuple<Item, CanSortKeys<Item>>[]): Item[]

export function orderBy<Item extends object>(array: Item[], order: Order<Item> | OrderTuple<Item, CanSortKeys<Item>>, ...orders: OrderTuple<Item, CanSortKeys<Item>>[]): Item[] {
	order = order instanceof Order ? order : new Order(order, ...orders)
	order.sortArray(array)
	return array
}


/**
 * Create a map object composed of `[key, value]` touples that returned from fn.
 * @param array The array to generate map object.
 * @param fn The function to return `[key, value]` tuple for each item.
 */

// Compar to map, object has same performance, and is more convinent to use, but will lose number key type.
export function indexBy<Item, V>(array: Item[], fn: (value: Item, index: number) => [string | number, V]): {[key: string]: V} {
	let index: {[key: string]: V} = {}

	for (let i = 0, len = array.length; i < len; i++) {
		let item = array[i]
		let [key, value] = fn(item, i)
		index[key] = value
	}

	return index
}


/**
 * Create a map object composed of keys generated from `keyOrFn` and original values.
 * @param array The array to generate key map object.
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 */
export function keyBy<Item>(array: Item[], keyOrFn: CanSortKeys<Item> | OrderFunction<Item>): {[key: string]: Item} {
	let index: {[key: string]: Item} = {}

	for (let item of array) {
		let key: string | number

		if (typeof keyOrFn === 'function') {
			key = keyOrFn(item)
		}
		else {
			key = item[keyOrFn] as unknown as string | number
		}

		index[key] = item
	}

	return index
}


/**
 * Creates a map object composed of keys generated from the results of running each element of collecti
 * @param array The array to group by. 
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 */
export function groupBy<Item>(array: Item[], keyOrFn: CanSortKeys<Item> | OrderFunction<Item>): {[key: string]: Item[]} {
	let index: {[key: string]: Item[]} = {}

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
 * Group and aggregate items in array by aggregate function
 * @param array The array to aggregate. 
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 * @param aggregateFn The aggregate function which accepts grouped items and key as arguments, and returns aggregate value.
 */
export function aggregate<Item, Value>(array: Item[], keyOrFn: CanSortKeys<Item> | OrderFunction<Item>, aggregateFn: (items: Item[], key?: string) => Value): {[key: string]: Value} {
	let index = groupBy(array, keyOrFn)

	return indexBy(Object.keys(index), (key: string) => {
		return [key, aggregateFn(index[key], key)]
	})
}


/**
 * Returns the length of the array.
 * @param array The array to count length.
 */
// Can't use `array: unknown` here, or it will cause `Item` in `aggregate` was inferred as `unknown` and make `CanSortKeys<Item>` not working.
export function count(array: any[]): number {
	return array.length
}


/**
 * Returns the sum of the array items.
 * @param array The array of numbers.
 */
export function sum(array: number[]): number {
	return array.reduce((v1, v2) => v1 + v2, 0)
}


/**
 * Returns the average value of the array items. returns 0 if no items in array.
 * @param array The array of numbers.
 */
export function avg(array: number[]): number {
	if (array.length === 0) {
		return 0
	}
	return sum(array) / array.length
}


/**
 * Returns the maximun value of the array items. returns -Infinity if no items in array.
 * @param array The array of numbers.
 */
export function max(array: number[]) {
	return Math.max(...array)
}


/**
 * Returns the maximun value of the array items. returns Infinity if no items in array.
 * @param array The array of numbers.
 */
export function min(array: number[]) {
	return Math.min(...array)
}