export namespace NumberUtils {
		
	/**
	 * Like `number.toFixed`, but alway returns a number.
	 * `decimalCount`: The decimal count that `number` will correct to, default value is `0`.
	 * e.g.:
	 *   `toDecimal(12.345, 2) = 12.34`
	 * 	 `toDecimal(12345, -2) = 12300`
	 */
	export function toDecimal(number: number, decimalCount = 0): number {
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
	 * `precision`: The precision value betweens `1-21`, default value is `1`.
	 * e.g.:
	 *   `toDecimal(123.45, 1) = 100`
	 *   `toDecimal(123.45, 2) = 120`
	 */
	export function toPrecision(number: number, precision: number = 1): number {
		return Number(number.toPrecision(precision))
	}


	/** 
	 * Compute euclidian modulo of `m % n`, will always return positive value.
	 * e.g., `-1 % 2` = 1.
	 */
	export function euclideanModulo(n: number, m: number): number {
		return ((n % m) + m) % m
	}


	/** Constrain value to be in range `min ~ max`. */
	export function clamp(x: number, min: number, max: number): number {
		return Math.max(min, Math.min(max, x))
	}


	/** Make a flag value to represent the negative or positive, or zero. */
	export function getFlag(x: number): 1 | -1 | 0 {
		return x > 0 ? 1 : x < 0 ? -1 : 0
	}


	/** Get a flag value to represent the negative or positive (include 0). */
	export function nonZeroFlag(x: number): 1 | -1 {
		return x >= 0 ? 1 : -1
	}


	/** Returns whether `x` close to `value`. */
	export function closeTo(x: number, value: number): boolean {
		return Math.abs(x - value) < Number.EPSILON
	}


	/** If `x` close to `0`, returns `0`, otherwise returns `x`. */
	export function mayZero(x: number): number {
		return mayValue(x, 0)
	}


	/** If `x` close to `value`, returns `value`, otherwise returns `x`. */
	export function mayValue(x: number, value: number): number {
		return closeTo(x, value) ? value : x
	}


	/** Get fract part from a number, always betweens `[0~1)`. */
	export function fract(v: number): number {
		return v - Math.floor(v)
	}
}