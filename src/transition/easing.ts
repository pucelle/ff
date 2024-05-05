import {NumberUtils} from '../utils'


/** Easing function. inputs `0~1`, outputs `0~1` normally. */
export type EasingFunction = (x: number) => number

/** Web Animation easing names, for web animation and transition. */
export type WebAnimationEasingName = keyof typeof CubicBezierEasingParameters | 'linear'

/** Per frame easing names, for per-frame animation and transition. */
export type TransitionEasingName = keyof typeof CubicBezierEasingParameters | keyof typeof CustomEasingFunctions


/** 
 * Specifies easing name and their bezier parameters,
 * Comes from `Bourbon` source codes.
 * Can also reference to `https://easings.net/`.
 */
const CubicBezierEasingParameters = {

	// BASE
	'ease'               : [0.250,  0.100, 0.250, 1.000],
	'ease-in'            : [0.420,  0.000, 1.000, 1.000],
	'ease-out'           : [0.000,  0.000, 0.580, 1.000],
	'ease-in-out'        : [0.420,  0.000, 0.580, 1.000],

	// EASE IN
	'ease-in-quad'       : [0.550,  0.085, 0.680, 0.530],
	'ease-in-cubic'      : [0.550,  0.055, 0.675, 0.190],
	'ease-in-quart'      : [0.895,  0.030, 0.685, 0.220],
	'ease-in-quint'      : [0.755,  0.050, 0.855, 0.060],
	'ease-in-sine'       : [0.470,  0.000, 0.745, 0.715],
	'ease-in-expo'       : [0.950,  0.050, 0.795, 0.035],
	'ease-in-circle'     : [0.600,  0.040, 0.980, 0.335],
	'ease-in-back'       : [0.600, -0.280, 0.735, 0.045],

	// EASE OUT
	'ease-out-quad'      : [0.250,  0.460, 0.450, 0.940],
	'ease-out-cubic'     : [0.215,  0.610, 0.355, 1.000],
	'ease-out-quart'     : [0.165,  0.840, 0.440, 1.000],
	'ease-out-quint'     : [0.230,  1.000, 0.320, 1.000],
	'ease-out-sine'      : [0.390,  0.575, 0.565, 1.000],
	'ease-out-expo'      : [0.190,  1.000, 0.220, 1.000],
	'ease-out-circle'    : [0.075,  0.820, 0.165, 1.000],
	'ease-out-back'      : [0.175,  0.885, 0.320, 1.275],

	// EASE IN OUT
	'ease-in-out-quad'   : [0.455,  0.030, 0.515, 0.955],
	'ease-in-out-cubic'  : [0.645,  0.045, 0.355, 1.000],
	'ease-in-out-quart'  : [0.770,  0.000, 0.175, 1.000],
	'ease-in-out-quint'  : [0.860,  0.000, 0.070, 1.000],
	'ease-in-out-sine'   : [0.445,  0.050, 0.550, 0.950],
	'ease-in-out-expo'   : [1.000,  0.000, 0.000, 1.000],
	'ease-in-out-circle' : [0.785,  0.135, 0.150, 0.860],
	'ease-in-out-back'   : [0.680, -0.550, 0.265, 1.550],
}

/** Customized easing functions. */
const CustomEasingFunctions = {

	'linear'(x: number): number {
		return x
	},

	'ease-in-elastic'(x: number) {
		return x === 0
			? 0
			: x === 1
			? 1
			: -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * (2 * Math.PI) / 3)
	},

	'ease-out-elastic'(x: number) {
		return x === 0
			? 0
			: x === 1
			? 1
			: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1
	},

	'ease-in-out-elastic'(x: number) {
		return x === 0
			? 0
			: x === 1
			? 1
			: x < 0.5
			? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * (2 * Math.PI) / 4.5)) / 2
			: (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1
	},

	'ease-in-bounce'(x: number) {
		return 1 - bounceOut(1 - x);
	},

	'ease-out-bounce': bounceOut,

	'ease-in-out-bounce'(x: number) {
		return x < 0.5
			? (1 - bounceOut(1 - 2 * x)) / 2
			: (1 + bounceOut(2 * x - 1)) / 2
	},
}


/** Cache compiled easing functions. */
const EasingFunctionCache: Partial<Record<TransitionEasingName, EasingFunction>> = {...CustomEasingFunctions}


/** From `https://easings.net/`. */
function bounceOut(x: number) {
	const n1 = 7.5625
	const d1 = 2.75

	if (x < 1 / d1) {
		return n1 * x * x
	}
	else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75
	}
	else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375
	}
	else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375
	}
}

/**
 * Get a `(x) => y` easing function by easing name,
 * Used to mapped time percentage to it's value percentage.
 */
export function getEasingFunction(name: TransitionEasingName): EasingFunction {
	if (EasingFunctionCache[name]) {
		return EasingFunctionCache[name]!
	}
	else {
		let [x1, y1, x2, y2] = CubicBezierEasingParameters[name as keyof typeof CubicBezierEasingParameters]
		return EasingFunctionCache[name] = makeCubicBezierEasingFunction(x1, y1, x2, y2)
	}
}


/** Compile to a easing function `x => y` from it's easing name. */
function makeCubicBezierEasingFunction(x1: number, y1: number, x2: number, y2: number) {

	//	P(t)  = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t)^2 * P2 + t^3 * P3, t in [0, 1]
	//
	//	Get the x axis projecting function, and knows x0 = 0, x3 = 1, got:
	//	Cx(t) = 3t(1-t)^2 * x1 + 3t^2(1-t) * x2 + t^3
	//		  = (3x1 - 3x2 + 1) * t^3 + (-6x1 + 3x2) * t^2 + 3x1 * t
	//	
	//	From Cx(t) = x, got t by binary search algorithm:
	//	Cy(t) = (3y1 - 3y2 + 1) * t^3 + (-6y1 + 3y2) * t^2 + 3y1 * t

	let ax =  3 * x1 - 3 * x2 + 1
	let bx = -6 * x1 + 3 * x2
	let cx =  3 * x1

	let ay =  3 * y1 - 3 * y2 + 1
	let by = -6 * y1 + 3 * y2
	let cy =  3 * y1

	return function (x: number) {
		let d = -x
		let t1 = 0
		let t2 = 1
		let t = (t1 + t2) / 2

		// Precision to 1 / 2^20.
		for (let i = 0; i < 20; i++) {
			let v = ((ax * t + bx ) * t + cx) * t + d

			if (v < 0) {
				t1 = t
			}
			else {
				t2 = t
			}

			t = (t1 + t2) / 2
		}

		return NumberUtils.toDecimal(((ay * t + by ) * t + cy) * t, 5)
	}
}


/** Get `cubic-bezier(...)` or `linear` as CSS easing name. */
export function getCSSEasingValue(easing: WebAnimationEasingName): string {
	return CubicBezierEasingParameters.hasOwnProperty(easing)
		? 'cubic-bezier(' + CubicBezierEasingParameters[easing as keyof typeof CubicBezierEasingParameters].join(', ') + ')'
		: easing
}
