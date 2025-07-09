/**
 * Convert number to make it in fixed-point notation.
 * Works like `number.toFixed`, but alway returns a number.
 * @param decimalCount The decimal count that `number` will be fixed to.
 * 
 * e.g.:
 * ```
 *   toDecimal(12.345, 2) = 12.34
 * 	 toDecimal(12345, -2) = 12300
 * ```
 */
export function toDecimal(number: number, decimalCount: number): number {
	if (number === 0) {
		return 0
	}

	if (decimalCount > 0) {
		let n = Math.pow(10, decimalCount)
		return Math.round(number * n) / n
	}
	else {
		let n = Math.pow(10, -decimalCount)
		return Math.round(number / n) * n
	}
}

/**
 * Nearly same with `number.toPrecision`, except it always returns a number.
 * @param precision The precision value betweens `1-21`.
 * 
 * e.g.:
 * ```
 *   toPrecision(123.45, 1) = 100
 *   toPrecision(123.45, 2) = 120
 * ```
 */
export function toPrecision(number: number, precision: number): number {
	return Number(number.toPrecision(precision))
}



/** 
 * Compute euclidean modulo of `n % m`, will always return positive value.
 * 
 * e.g., `-1 % 2 = 1`.
 */
export function euclideanModulo(n: number, m: number): number {
	return ((n % m) + m) % m
}

/** Get Greatest Common Divisor of two numbers. */
export function gcd(a: number, b: number) {
	if (b === 0) {
		return a
	}

	return gcd(b, a % b)
}



/** Constrain value to be in range `min ~ max`. */
export function clamp(x: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, x))
}



/** 
 * Returns a flag value to represent whether value is negative or positive, or zero.
 * Note here it will not validate whether value is `NaN`.
 */
export function flag(x: number): 1 | -1 | 0 {
	return x > 0 ? 1 : x < 0 ? -1 : 0
}

/** 
 * Returns a flag value to represent whether value is negative or positive (include 0).
 * Note here it will not validate whether value is `NaN`.
 */
export function nonZeroFlag(x: number): 1 | -1 {
	return x >= 0 ? 1 : -1
}



/** Returns whether `x` nearly equals to `value`. */
export function nearlyEquals(x: number, value: number): boolean {
	return Math.abs(x - value) <= Number.EPSILON
}

/** If `x` is nearly equals to `0`, returns `0`, otherwise returns `x`. */
export function nearlyZero(x: number): number {
	return mayValue(x, 0)
}

/** If `x` is nearly equals to `value`, returns `value`, otherwise returns `x`. */
export function mayValue(x: number, value: number): number {
	return nearlyEquals(x, value) ? value : x
}



/** Get fract part of a number, always betweens `[0~1)`. */
export function fract(n: number): number {
	return n - Math.floor(n)
}
