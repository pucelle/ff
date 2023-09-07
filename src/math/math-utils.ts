import {NumberUtils} from '../utils'


const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI


export namespace MathUtils {

	
	/** Convert angle from degree to radinas. */
	export function degreeToRadians(degrees: number): number {
		return degrees * DEG2RAD
	}

	/** Convert angle from radians to degree. */
	export function radiansToDegree(radians: number): number {
		return radians * RAD2DEG
	}



	/** Linear interpolation betweens `a` and `b`, `bRate` specifies the rate of `b`. */
	export function mix(a: number, b: number, bRate: number): number {
		return a * (1 - bRate) + b * bRate
	}

	/** Returns a value which respresent the rate of number x inside range `start` and `end`. */
	export function linearInterpolate(x: number, start: number, end: number): number {
		return (x - start) / (end - start)
	}

	/** 
	 * Returns a value betweens 0~1 which respresent the rate of number x inside range `min` and `max`.
	 * Get a rate that indicates the rate of `max` value to mix.
	 */
	export function linearStep(x: number, min: number, max: number): number {
		if (x <= min) {
			return 0
		}

		if (x >= max) {
			return 1
		}

		x = (x - min) / (max - min) || 0

		return x
	}



	/** 
	 * Solve One Variable Quadratic Equation like `ax^2 + bx + c = 0`.
	 * Resulted values will be sorted from lower to upper.
	 */
	export function solveOneVariableQuadraticEquation(a: number, b: number, c: number): [number, number] | null {
		if (a === 0) {
			return null
		}

		let delta = Math.sqrt(b * b - 4 * a * c)
		if (isNaN(delta)) {
			return null
		}

		delta *= NumberUtils.getFlag(a)

		return [
			(-b - delta) / (2 * a),
			(-b + delta) / (2 * a),
		]
	}



	/** 
	 * For every `value` that generated from ±`period` repetitively,
	 * Pick those inside range `[min, max)`.
	 */
	export function pickPeriodicValuesInRange(value: number, period: number, min: number, max: number): number[] {
		let vs: number[] = []
		let v = Math.ceil((min - value) / period) * period + value

		while (v < max) {
			vs.push(v)
			v += period
		}

		return vs
	}

	/** 
	 * For one `value` that generated from ±`period` repetitively,
	 * Pick one inside range `[min, max)`,
	 * if not in range, pick the closest edge value.
	 */
	export function pickClosestPeriodicValueInRange(value: number, period: number, min: number, max: number): number {
		let v = Math.ceil((min - value) / period) * period + value

		if (v < max) {
			return v
		}

		if (v - max < min - (v - period)) {
			return max
		}
		else {
			return min
		}
	}
}
