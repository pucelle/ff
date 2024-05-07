import * as MathUtils from './math-utils'
import {ValueListUtils} from '../utils'


/**
 * Locate the x value, at which the rate of the integral value equals `y`.
 * @param yRate The integral rate betweens 0~1.
 * @param integrogram Integrogram consist of accumulate values, first value `0` is dropped.
 * 
 * Histogram Values: [3, 2, 1]
 * Integrogram Values: [3, 5, 6]
 * Locate `yRate`=0.666: Integral Value is 6 * 0.666 = 4, interpolate between 3 and 5, then got `x=1.5`.
 */
export function locateIntegralX(yRate: number, integrogram: number[]): number {
	if (integrogram.length === 0) {
		return 0
	}

	yRate = Math.min(yRate, 1)

	let count = integrogram.length
	let totalArea = integrogram[count - 1]
	let integralValue = yRate * totalArea
	let index = ValueListUtils.binaryFindInsertIndex(integrogram, integralValue)

	if (index === count) {
		return count
	}
	else {
		let lower = index > 0 ? integrogram[index - 1] : 0
		let upper = integrogram[index]
		
		return index + MathUtils.linearInterpolate(integralValue, lower, upper)
	}
}


/**
 * Provide the x rate value, get the y value by an integrogram of y values.
 * 
 * @param xRate The x value betweens 0~1.
 * @param integrogram Integrogram consist of accumulate y values, first value `0` is dropped.
 * 
 * ```
 * Histogram Values: [3, 2, 1]
 * Integrogram Values: [3, 5, 6]
 * `xRate`=0.5: index is 0.5 * 3 = 1.5, interpolate integrogram[0] and integrogram[1], `got (3+5)/2 = 4`.
 * ```
 */
export function locateIntegralY(xRate: number, integrogram: number[]): number {
	if (integrogram.length === 0) {
		return 0
	}

	if (xRate <= 0) {
		return 0
	}

	if (xRate >= 1) {
		return integrogram[integrogram.length - 1]
	}

	let index = xRate * integrogram.length - 1
	let lowerIndex = Math.floor(index)
	let upperIndex = lowerIndex + 1
	let upperRate = index - lowerIndex

	let lowerValue = lowerIndex < 0 ? 0 : integrogram[lowerIndex]
	let upperValue = upperIndex < 0 ? 0 : integrogram[upperIndex]
	
	return MathUtils.mix(lowerValue, upperValue, upperRate)
}
