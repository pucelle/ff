import * as NumberUtils from './number-utils'


/** 
 * Make a list of numbers from `start` to `end` (but not include `end`), with specified `step`.
 * - `end`: The last number of the returned list is always lower than `end`.
 * - `step`: Default value is `1` or `-1` determined by which is bigger for start and end values.
 */
export function *range(start: number, end: number, step: number = start <= end ? 1 : -1): Iterable<number> {
	let flag = NumberUtils.flag(step)
	if (flag === 0) {
		throw new RangeError(`"Step" must not be zero!`)
	}
	
	for (let i = start; (i - end) * flag < 0; i += step) {
		yield i
	}
}


/** Returns a promise which will be resolved after counting timeout for `ms` milliseconds. */
export function sleep(ms: number = 0) {
	return new Promise(resolve => setTimeout(resolve, ms))
}


/** Empty function, nothing to handle. */
export function noop() {}