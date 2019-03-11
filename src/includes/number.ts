/**
 * Like the opposite of toFixed, but it supports both positive and negative power, and always returns a number.
 * @param number Specify the number to fix.
 * @param power Specify the power that the number will correct to.
 */
export function toPower(number: number, power = 0): number {
	let maxPower = Math.floor(Math.log(number) / Math.log(10))
	power = Math.min(maxPower, power)

	if (power > 0) {
		let n = Math.pow(10, power)
		return Math.round(number / n) * n
	}

	//this can avoid the `0.1 + 0.2 != 0.3`
	else {
		let n = Math.pow(10, -power)
		return Math.round(number * n) / n
	}
}


/**
 * Like a % b, but always returns positive number.
 * @param number Specify the number to calculate modulo.
 * @param modulo Specify the modulo of number.
 */
export function mod(number: number, modulo: number): number {
	return (number % modulo + Math.abs(modulo)) % modulo
}


/**
 * Returns a new number which is constrained in a range.
 * @param number Specify the number to constrain.
 * @param min Specify the minimum number.
 * @param max Specify the maximum number.
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