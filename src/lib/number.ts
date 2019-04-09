/**
 * Like the opposite of toFixed, but it supports both positive and negative power, and always returns a number.
 * @param number The number to fix.
 * @param power The power that the number will correct to.
 */
export function toPower(number: number, power = 0): number {
	if (number < 0) {
		return - toPower(-number)
	}

	if (number === 0) {
		return 0
	}
	
	let maxPower = Math.floor(Math.log(number) / Math.log(10))
	power = Math.min(maxPower, power)

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
 * Like a % b, but always returns positive number.
 * @param number The number to calculate modulo.
 * @param modulo The modulo of number.
 */
export function mod(number: number, modulo: number): number {
	return (number % modulo + Math.abs(modulo)) % modulo
}


/**
 * Returns a new number which is constrained in a range.
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