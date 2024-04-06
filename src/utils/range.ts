import {NumberUtils} from './number'


/** 
 * Make a list of numbers from `start` to `end` (but not include `end`), with specified `step`.
 * - `end`: The last number of the returned list is always lower than `end`.
 * - `step`: default value is `1`.
 */
export function *range(start: number, end: number, step: number = 1): Iterable<number> {
	let flag = NumberUtils.flag(step)
	if (flag === 0) {
		throw new RangeError(`"Step" must not be zero!`)
	}
	
	for (let i = start; i * flag < end * flag; i += step) {
		yield i
	}
}