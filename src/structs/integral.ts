import {MathUtils} from '../math'
import {ValueListUtils} from '../utils'


/**
 * Locate the x value, at which the rate of the integral value equals `y`.
 * 
 * y: The integral rate betweens 0~1.
 * integrogram: Integrogram consist of accumulate values.
 * 
 * Histogram Values: [3, 2, 1]
 * Integrogram Values: [3, 5, 6]
 * Locate y=0.5: Integral Value is 6 * 0.5 = 3, found `index=1`, then got `x=1/3 = 0.333`.
 */
export function locateIntegralX(y: number, integrogram: number[]): number {
	if (integrogram.length === 0) {
		return 0
	}

	y = Math.min(y, 1)

	let count = integrogram.length
	let totalArea = integrogram[count - 1]
	let integralValue = y * totalArea
	let index = ValueListUtils.binaryFindInsertIndex(integrogram, integralValue)

	if (index === count) {
		return 1
	}
	else {
		let lower = index > 0 ? integrogram[index - 1] : 0
		let upper = integrogram[index]
		
		return (index + MathUtils.linearInterpolate(integralValue, lower, upper)) / count
	}
}


/**
 * Provide the x value, get the y value by an integrogram of y values.
 * 
 * x: The x value betweens 0~1.
 * integrogram: Integrogram consist of accumulate y values.
 * 
 * Histogram Values: [3, 2, 1]
 * Integrogram Values: [3, 5, 6]
 * x=0.5: index is 0.5 * 3 = 1.5, interpolate integrogram[1] and integrogram[2].
 */
export function locateIntegralY(x: number, integrogram: number[]): number {
	if (integrogram.length === 0) {
		return 0
	}

	if (x <= 0) {
		return 0
	}

	if (x >= 1) {
		return integrogram[integrogram.length - 1]
	}

	let index = x * integrogram.length
	let lowerIndex = Math.floor(index) - 1	// Note this `- 1`, draw a intergral diagram can help to understand.
	let upperIndex = lowerIndex + 1
	let upperRate = index - lowerIndex

	let lowerValue = integrogram[lowerIndex]
	let upperValue = integrogram[upperIndex]
	
	return MathUtils.mix(lowerValue, upperValue, upperRate)
}