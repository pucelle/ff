/**
 * Like `number.toFixed`, but alway returns a number.
 * @param number The number to fix.
 * @param decimalCount The decimal count that `number` will correct to, default value is 0.
 */
export function toDecimal(number: number, decimalCount = 0): number {
	return toPower(number, -decimalCount)
}


/**
 * Like the opposite of `number.toFixed`, but always returns a number. e.g., `toPower(1234, 2) = 1200`.
 * @param number The number to fix.
 * @param power The power that `number` will correct to, default value is 0.
 */
export function toPower(number: number, power = 0): number {
	if (number < 0) {
		return - toPower(-number, power)
	}

	if (number === 0) {
		return 0
	}

	if (power > 0) {
		let n = Math.pow(10, power)
		return Math.round(number / n) * n
	}

	// This can avoid `0.1 + 0.2 !== 0.3`
	else {
		let n = Math.pow(10, -power)
		return Math.round(number * n) / n
	}
}


/**
 * Nearly same with `number.toPrecision`, except here always returns a number.
 * @param number The number to transfer to specified precision.
 * @param precision The precision value betweens 1-21, default value is 1.
 */
export function toPrecision(number: number,  precision: number = 1): number {
	return Number(number.toPrecision(precision))
}


/**
 * Like `a % b`, but always returns positive number. e.g., `mod(-1, 2) = 1`.
 * @param number The number to calculate modulo.
 * @param modulo The modulo of number.
 */
export function mod(number: number, modulo: number): number {
	return (number % modulo + Math.abs(modulo)) % modulo
}


/**
 * Returns a new number which is constrained in a minimal and maximum range.
 * @param number The number to constrain.
 * @param min The minimum number.
 * @param max The maximum number.
 */
export function constrain(number: number, min: number, max: number): number {
	if (min > max) {
		[min, max] = [max, min]
	}

	if (number < min) {
		number = min
	}
	else if (number > max) {
		number = max
	}

	return number
}