/**
 * Add items to array, for each item in items, will push into array if is not exist in array.
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
 * Remove items from array, returns the actual removed items.
 * @param array The array to remove items.
 * @param items The items to remove from array.
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
 * Remove items match `fn` from array, returns the removed items.
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
 * Remove items match `fn` from array, returns the removed items.
 * @param array The array to remove items.
 * @param fn The function which returns boolean values to determinae whether to remove item.
 */
export function removeWhere<T>(array: T[], fn: (item: T, index: number) => boolean): T[] {
	let removed = []

	for (let i = array.length - 1; i >= 0; i--) {
		if (fn(array[i], i)) {
			removed.unshift(...array.splice(i, 1))
		}
	}

	return removed
}


/**
 * Returns a new array which has been removed duplicate items.
 * @param array The array to remove duplicate items.
 */
export function unique<T extends number | string>(array: T[]): T[] {
	let set: Set<T> = new Set()

	for (let item of array) {
		set.add(item)
	}

	return [...set.values()]
}


/**
 * Creates an array of unique values from given arrays.
 * @param arrays The arrays to get union from.
 */
export function union<T extends number | string>(...arrays: T[][]): T[] {
	let set: Set<T> = new Set()

	for (let array of arrays) {
		for (let item of array) {
			set.add(item)
		}
	}

	return [...set.values()]
}


/**
 * Creates an array of unique values that are included in all given arrays.
 * @param arrays The arrays to get intersection from.
 */
export function intersect<T extends number | string>(...arrays: T[][]): T[] {
	let map: Map<T, number> = new Map()
	let interset: T[] = []

	for (let array of arrays) {
		for (let item of array) {
			map.set(item, (map.get(item) || 0) + 1)
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
export function difference<T extends number | string>(array: T[], ...excludeArrays: T[][]): T[] {
	let set: Set<T> = new Set()

	for (let item of array) {
		set.add(item)
	}

	for (let difArray of excludeArrays) {
		for (let item of difArray) {
			set.delete(item)
		}
	}

	return [...set.values()]
}


export type OrderDirection = -1 | 1 | 'asc' | 'desc'
export type OrderFunction<T> = (item: T) => string | number
export type OrderTuple<T, K> = K | OrderFunction<T> | [K | OrderFunction<T>, OrderDirection]
type NormativeOrderTuple<T, K> = [K | OrderFunction<T>, -1 | 1]
type CanSortKeys<T> = Extract<{[P in keyof T]: T[P] extends string | number ? P : never}[keyof T], string | number>

//know nothing about <T> when instantiate, K should not assert as 'extends keyof T' or 'extends CanSortKeys<T>'
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
				this.throwInvalidArguments(orders)
			}
		}
	}

	private throwInvalidArguments(orders: any) {
		throw new Error(JSON.stringify(orders) + ' doesn\'t specify any valid key and order.')
	}

	sortArray(array: T[]) {
		array.sort((a, b) => this.compare(a, b))
	}

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

	binaryInsert(array: T[], item: T): T[] {
		let index = this.binaryFindIndexToInsert(array, item)
		array.splice(index, 0, item)
		return array
	}

	binaryFindIndexToInsert(array: T[], item: T): number {
		if (array.length === 0) {
			return 0
		}

		let compareResult = this.compare(item, array[0])
		if (compareResult === 0 || compareResult === -1) {
			return 0
		}
		if (array.length === 1) {
			return 1
		}

		compareResult = this.compare(item, array[array.length - 1])
		if (compareResult === 0) {
			return array.length - 1
		}
		if (compareResult === 1) {
			return array.length
		}

		let start = 0
		let end = array.length - 1

		while (end - start > 1) {
			let center = Math.floor((end + start) / 2)
			let compareResult = this.compare(item, array[center])

			if (compareResult === 0) {
				return center
			}
			else if (compareResult === -1) {
				end = center
			}
			else {
				start = center
			}
		}

		return end
	}

	binaryFindIndex(array: T[], item: T): number {
		let index = this.binaryFindIndexToInsert(array, item)
		if (index < array.length && this.compare(item, array[index]) === 0) {
			return index
		}
		return -1
	}
}


/**
 * Sort object type items inside array by instantiated `ff.Order` object.
 * @param array The array to order.
 * @param order instantiated `ff.Order`.
 */
export function orderBy<T extends object>(array: T[], order: Order<T>): T[]

/**
 * Sort object type items inside array by specified orders.
 * @param array The array to order.
 * @param orders Rest argument of type `key` or `OrderFunction` which will return a `key`, or [`key` / `OrderFunction`, `OrderDirection`].
 */
/*
why `export function orderBy<T extends object, K extends CanSortKeys<T>>...` not works:
when <K> appears multiple times at contexual, <K> was inferred from multiple condidate types

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
 * Create a map object composed of `[key, value]` touples that returned from fn.
 * @param array The array to generate map object.
 * @param fn The function to return `[key, value]` tuple for each item.
 */

//Compar to map, object has same performance, and is more convinent to use, but will lose number key type.
export function indexBy<T, V>(array: T[], fn: (value: T, index: number) => [string | number, V]): {[key: string]: V} {
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
export function keyBy<T>(array: T[], keyOrFn: CanSortKeys<T> | OrderFunction<T>): {[key: string]: T} {
	let index: {[key: string]: T} = {}

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
 * Group and aggregate items in array by aggregate function
 * @param array The array to aggregate. 
 * @param keyOrFn The key attribute name of each item whose related value will be used as key. or the function which accepts each item as argument and returns a key.
 * @param aggregateFn The aggregate function which accepts grouped items and key as arguments, and returns aggregate value.
 */
export function aggregate<T, V>(array: T[], keyOrFn: CanSortKeys<T> | OrderFunction<T>, aggregateFn: (items: T[], key?: string) => V): {[key: string]: V} {
	let index = groupBy(array, keyOrFn)

	return indexBy(Object.keys(index), (key: string) => {
		return [key, aggregateFn(index[key], key)]
	})
}


/**
 * Returns the length of the array.
 * @param array The array to count length.
 */
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