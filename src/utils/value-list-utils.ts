/** Returns the sum of all the numeric values in `list`. */
export function sum(list: number[]): number {
	return list.reduce((v1, v2) => v1 + v2, 0)
}


/**
 * Returns the average value of all the numeric values in `list`.
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
export function minIndex(values: ArrayLike<number>): number {
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
 * Returns the index of the maximum value of all the values.
 * Returns `-1` if no values or all values are `-Infinity`.
 */
export function maxIndex(values: ArrayLike<number>): number {
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
export function minOf(values: ArrayLike<number>): number | null {
	let index = minIndex(values)
	return index >= 0 ? values[index] : null
}


/** 
 * Find the maximum value in a list.
 * Returns `null` if no items or all values are `-Infinity`.
 */
export function maxOf(values: ArrayLike<number>): number | null {
	let index = maxIndex(values)
	return index >= 0 ? values[index] : null
}


/** 
 * Binary find from a already sorted from lower to upper list,
 * find a index to insert the new value.
 * Returned index betweens `0 ~ list length`.
 * Note when some equal values exist, the returned index prefers upper.
 */
export function binaryFindInsertIndex<T extends number | string>(sorted: ArrayLike<T>, toInsert: T): number {
	if (sorted.length === 0) {
		return 0
	}

	if (sorted[0] > toInsert) {
		return 0
	}

	if (sorted[sorted.length - 1] <= toInsert) {
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
export function binaryFindLowerInsertIndex<T extends number | string>(sorted: ArrayLike<T>, toInsert: T): number {
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
export function binaryInsert<T extends number | string>(sorted: T[], toInsert: T): number {
	let index = binaryFindInsertIndex(sorted, toInsert)
	sorted.splice(index, 0, toInsert)
	return index
}


/** Binary find a numeric value from a list, which has been sorted from lower to upper. */
export function binaryFind<T extends number | string>(sorted: ArrayLike<T>, value: T): T | undefined {
	let index = binaryFindLowerInsertIndex(sorted, value)
	if (index === sorted.length) {
		return undefined
	}

	if (sorted[index] === value) {
		return sorted[index]
	}

	return undefined
}