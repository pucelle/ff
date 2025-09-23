import * as MathUtils from './math-utils'
import {ValueListUtils} from '../utils'


/**
 * Locate the x rate, at which the rate of the integral value equals `y`.
 * @param yRate The integral rate betweens 0~1.
 * @param integrogram Integrogram consist of accumulate values, first value `0` is dropped.
 * 
 * Histogram Values: [3, 2, 1]
 * Integrogram Values: [3, 5, 6]
 * Locate `yRate`=0.666: Integral Value is 6 * 0.666 = 4, interpolate between 3 and 5, then got `x=1.5/3 = 0.5`.
 */
export function lookupXRateByYRate(yRate: number, integrogram: number[]): number {
	if (integrogram.length === 0) {
		return 0
	}

	if (yRate <= 0) {
		return 0
	}

	if (yRate >= 1) {
		return 1
	}

	let count = integrogram.length
	let total = integrogram[count - 1]
	let integralValue = yRate * total
	let index = ValueListUtils.binaryFindInsertIndex(integrogram, integralValue)

	if (index === count) {
		return 1
	}
	else {
		let lower = index > 0 ? integrogram[index - 1] : 0
		let upper = integrogram[index]
		
		return (index + MathUtils.linearInterpolate(integralValue, lower, upper)) / integrogram.length
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
 * `xRate`=0.5: index is 0.5 * 3 = 1.5, interpolate integrogram[0] and integrogram[1], `got (3+5)/2 / 6 = 4/6 = 0.666`.
 * ```
 */
export function lookupYRateByXRate(xRate: number, integrogram: number[]): number {
	if (integrogram.length === 0) {
		return 0
	}

	if (xRate <= 0) {
		return 0
	}
	
	if (xRate >= 1) {
		return 1
	}

	let total = integrogram[integrogram.length - 1]
	let index = xRate * integrogram.length - 1
	let lowerIndex = Math.floor(index)
	let upperIndex = lowerIndex + 1
	let upperRate = index - lowerIndex

	let lowerValue = lowerIndex < 0 ? 0 : integrogram[lowerIndex]
	let upperValue = upperIndex < 0 ? 0 : integrogram[upperIndex]
	
	return MathUtils.mix(lowerValue, upperValue, upperRate) / total
}
