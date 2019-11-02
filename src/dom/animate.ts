import {getStyleAsNumber, StyleName, setStyle} from './style'
import {normativeStyleObject} from "./util"


export type AnimationEasing = keyof typeof CUBIC_BEZIER_EASINGS | 'linear'
export type AnimationName = StyleName | 'scrollTop' | 'scrollLeft'
export type AnimationFrame = {[key in StyleName]?: string | number}


export let defaultAnimationDuration: number = 200
export let defaultAnimationEasing: AnimationEasing = 'ease-out-quad'

const ElementAnimationMap: WeakMap<HTMLElement, Animation> = new WeakMap()


// Copied from `Bourbon` source codes.
const CUBIC_BEZIER_EASINGS = {

	// BASE
	'ease'              : [0.250,  0.100, 0.250, 1.000],
	'ease-in'           : [0.420,  0.000, 1.000, 1.000],
	'ease-out'          : [0.000,  0.000, 0.580, 1.000],
	'ease-in-out'       : [0.420,  0.000, 0.580, 1.000],

	// EASE IN
	'ease-in-quad'      : [0.550,  0.085, 0.680, 0.530],
	'ease-in-cubic'     : [0.550,  0.055, 0.675, 0.190],
	'ease-in-quart'     : [0.895,  0.030, 0.685, 0.220],
	'ease-in-quint'     : [0.755,  0.050, 0.855, 0.060],
	'ease-in-sine'      : [0.470,  0.000, 0.745, 0.715],
	'ease-in-expo'      : [0.950,  0.050, 0.795, 0.035],
	'ease-in-circ'      : [0.600,  0.040, 0.980, 0.335],
	'ease-in-back'      : [0.600, -0.280, 0.735, 0.045],

	// EASE OUT
	'ease-out-quad'     : [0.250,  0.460, 0.450, 0.940],
	'ease-out-cubic'    : [0.215,  0.610, 0.355, 1.000],
	'ease-out-quart'    : [0.165,  0.840, 0.440, 1.000],
	'ease-out-quint'    : [0.230,  1.000, 0.320, 1.000],
	'ease-out-sine'     : [0.390,  0.575, 0.565, 1.000],
	'ease-out-expo'     : [0.190,  1.000, 0.220, 1.000],
	'ease-out-circ'     : [0.075,  0.820, 0.165, 1.000],
	'ease-out-back'     : [0.175,  0.885, 0.320, 1.275],

	// EASE IN OUT
	'ease-in-out-quad'  : [0.455,  0.030, 0.515, 0.955],
	'ease-in-out-cubic' : [0.645,  0.045, 0.355, 1.000],
	'ease-in-out-quart' : [0.770,  0.000, 0.175, 1.000],
	'ease-in-out-quint' : [0.860,  0.000, 0.070, 1.000],
	'ease-in-out-sine'  : [0.445,  0.050, 0.550, 0.950],
	'ease-in-out-expo'  : [1.000,  0.000, 0.000, 1.000],
	'ease-in-out-circ'  : [0.785,  0.135, 0.150, 0.860],
	'ease-in-out-back'  : [0.680, -0.550, 0.265, 1.550],
}


const easingFns: {[key: string]: (x: number) => number} = {
	linear: function(x: number): number {
		return x
	}
}

/**
 * Get a `(x) => y` function from easing name.
 * @param easing The extended easing name.
 */
export function getEasingFunction(name: AnimationEasing): (x: number) => number {
	if (name === 'linear') {
		return easingFns[name]
	}
	else {
		return easingFns[name] = getCubicBezierEasingFunction(name)
	}
}

/**
 * Get `cubic-bezier(...)` from easing name.
 * @param easing The extended easing name.
 */
export function getEasing(easing: AnimationEasing): string {
	return CUBIC_BEZIER_EASINGS.hasOwnProperty(easing)
		? 'cubic-bezier(' + CUBIC_BEZIER_EASINGS[easing as keyof typeof CUBIC_BEZIER_EASINGS].join(', ') + ')'
		: easing
}



/**
F(t)  = (1-t)^3 * P0 + 3t(1-t)^2 * P1 + 3t^2(1-t)^2 * P2 + t^3 * P3, t in [0, 1]

Get the x axis projecting function, and knows x0 = 0, x3 = 1, got:
Cx(t) = 3t(1-t)^2 * x1 + 3t^2(1-t) * x2 + t^3
	  = (3x1 - 3x2 + 1) * t^3 + (-6x1 + 3x2) * t^2 + 3x1 * t

From Cx(t) = x, got t by binary iteration algorithm, then pass it to y axis projecting function:
Cy(t) = (3y1 - 3y2 + 1) * t^3 + (-6y1 + 3y2) * t^2 + 3y1 * t

*/
function getCubicBezierEasingFunction(name: keyof typeof CUBIC_BEZIER_EASINGS) {
	let [x1, y1, x2, y2] = CUBIC_BEZIER_EASINGS[name]
	let a =  3 * x1 - 3 * x2 + 1
	let b = -6 * x1 + 3 * x2
	let c =  3 * x1

	let ay =  3 * y1 - 3 * y2 + 1
	let by = -6 * y1 + 3 * y2
	let cy =  3 * y1

	return function (x: number) {
		if (x === 0) {
			return 0
		}
		else if (x === 1) {
			return 1
		}

		let d = -x
		let t1 = 0
		let t2 = 1
		let t = (t1 + t2) / 2

		while (t2 - t1 > 0.0001) {
			let v = ((a * t + b ) * t + c) * t + d

			if (v < 0) {
				t1 = t
			}
			else {
				t2 = t
			}

			t = (t1 + t2) / 2
		}

		return ((ay * t + by ) * t + cy) * t
	}
}


function playIntervalAnimation(
	duration: number = defaultAnimationDuration,
	easing: AnimationEasing = defaultAnimationEasing,
	onInterval: (x: number) => void,
	onEnd: (finish: boolean) => void,
) {
	let startTimestamp = performance.now()
	let easingFn = getEasingFunction(easing)
	let frameId = 0

	let runNextFrame = () => {
		frameId = requestAnimationFrame((timestamp) => {
			let timeDiff = timestamp - startTimestamp
			let x = timeDiff / duration
			
			if (x >= 1) {
				frameId = 0
				onInterval(1)

				if (onEnd) {
					onEnd(true)
				}
			}
			else {
				let y = easingFn(x)
				onInterval(y)
				runNextFrame()
			}
		})
	}

	runNextFrame()

	return () => {
		if (frameId) {
			cancelAnimationFrame(frameId)

			if (onEnd) {
				onEnd(false)
			}
		}
	}
}


/**
 * Animate numberic style property or `scrollLeft` and `scrollTop` on `el`.
 * Execute animation by setting values in `requestAnimationFrame`.
 * @param el The element to animate.
 * @param property The style property or `scrollLeft` and `scrollTop`.
 * @param startValue The start value of `property`.
 * @param endValue  The end value of `property`.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animateProperty(el: HTMLElement, property: AnimationName, startValue: number, endValue: number, duration: number, easing: AnimationEasing = defaultAnimationEasing) {
	let stop

	let promise: Promise<boolean> = new Promise((resolve) => {
		stop = playIntervalAnimation(
			duration,
			easing,
			(y) => {
				let value = startValue + (endValue - startValue) * y
				if (property === 'scrollTop' || property === 'scrollLeft') {
					el[property] = value
				}
				else {
					setStyle(el, property, value)
				}
			},
			resolve
		)
	})

	return {
		promise,
		stop,
	}
}


/**
 * Animate numberic style property or `scrollLeft` and `scrollTop` on `el`.
 * Execute animation by setting values in `requestAnimationFrame`.
 * @param el The element to animate.
 * @param property The style property or `scrollLeft` and `scrollTop`.
 * @param startValue The start value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animatePropertyFrom(el: HTMLElement, property: AnimationName, startValue: number, duration: number, easing: AnimationEasing = defaultAnimationEasing) {
	let endValue: number
	if (property === 'scrollTop' || property === 'scrollLeft') {
		endValue = el[property]
	}
	else {
		endValue = getStyleAsNumber(el, property)
	}
	
	return animateProperty(el, property, startValue, endValue, duration, easing)
}


/**
 * Animate numberic style property or `scrollLeft` and `scrollTop` on `el`.
 * Execute animation by setting values in `requestAnimationFrame`.
 * @param el The element to animate.
 * @param property The style property or `scrollLeft` and `scrollTop`.
 * @param endValue The end value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animatePropertyTo(el: HTMLElement, property: AnimationName, endValue: number, duration: number, easing: AnimationEasing = defaultAnimationEasing) {
	let startValue: number
	if (property === 'scrollTop' || property === 'scrollLeft') {
		startValue = el[property]
	}
	else {
		startValue = getStyleAsNumber(el, property)
	}

	return animateProperty(el, property, startValue, endValue, duration, easing)
}


/**
 * Animate by a value range, `fn` recives current value as argument.
 * @param fn The function which will got a current state number value as argument.
 * @param startValue The start value.
 * @param endValue  The end value.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animateByFunction(fn: (y: number) => void, startValue: number, endValue: number, duration: number, easing: AnimationEasing = defaultAnimationEasing) {
	let stop

	let promise: Promise<boolean> = new Promise((resolve) => {
		stop = playIntervalAnimation(duration, easing,
			(y) => {
				fn(startValue + (endValue - startValue) * y)
			},
			resolve
		)
	})

	return {
		promise,
		stop,
	}
}


/**
 * Execute standard web animation on element.
 * After animation end, the state of element will go back to the start state.
 * @param el The element to execute web animation.
 * @param startFrame The start frame.
 * @param endFrame The end frame.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animate(el: HTMLElement, startFrame: AnimationFrame, endFrame: AnimationFrame, duration: number = defaultAnimationDuration, easing: AnimationEasing = defaultAnimationEasing) {
	if (!el.animate) {
		return Promise.resolve(false)
	}
	stopAnimation(el)
	
	startFrame = normativeStyleObject(startFrame as any)
	endFrame = normativeStyleObject(endFrame as any)
	let cubicEasing = getEasing(easing)

	let animation = el.animate([startFrame, endFrame], {
		easing: cubicEasing,
		duration,
	})

	el.style.pointerEvents = 'none'
	ElementAnimationMap.set(el, animation)

	return new Promise((resolve) => {
		animation.addEventListener('finish', () => {
			el.style.pointerEvents = ''
			ElementAnimationMap.delete(el)
			resolve(true)
		}, false)

		animation.addEventListener('cancel', () => {
			ElementAnimationMap.delete(el)
			resolve(false)
		}, false)
	}) as Promise<boolean>
}


/** The default style of element, which is not 0 */
const DEFAULT_STYLE: {[key: string]: string} = {
	transform: 'none'
}


/**
 * Execute standard web animation on element with start frame specified, the end frame will be set as zero or empty values.
 * @param el The element to execute web animation.
 * @param startFrame The start frame.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animateFrom(el: HTMLElement, startFrame: AnimationFrame, duration: number = defaultAnimationDuration, easing: AnimationEasing = defaultAnimationEasing) {
	let endFrame: AnimationFrame = {}
	let style = getComputedStyle(el)

	for (let property in startFrame) {
		endFrame[property as StyleName] = (style as any)[property] || DEFAULT_STYLE[property] || '0'
	}

	return animate(el, startFrame, endFrame, duration, easing)
}


/**
 * Execute standard web animation on element with end frame specified, the end frame will be specified as values of current state.
 * After animation executed, will apply end frame values to element.
 * @param el The element to execute web animation.
 * @param endFrame The end frame.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export async function animateTo(el: HTMLElement, endFrame: AnimationFrame, duration: number = defaultAnimationDuration, easing: AnimationEasing = defaultAnimationEasing) {
	let startFrame: AnimationFrame = {}
	let style = getComputedStyle(el)

	// Fix '' to `0` or `none`
	let standardEndFrame = Object.assign({}, endFrame)
	for (let property in standardEndFrame) {
		if (standardEndFrame[property as StyleName] === '') {
			standardEndFrame[property as StyleName] = DEFAULT_STYLE[property] || '0'
		}
	}

	for (let property in endFrame) {
		startFrame[property as StyleName] = (style as any)[property] || DEFAULT_STYLE[property] || '0'
	}

	let finish = await animate(el, startFrame, standardEndFrame, duration, easing)
	if (finish) {
		setStyle(el, endFrame)
	}

	return finish
}


/** Execute standard web animation, capture current state as start frame, and capture a new state later as end frame.
 * @param el The element to execute web animation.
 * @param properties The style properties to capture.
 * @param duration The animation duration.
 * @param easing  The animation easing.
 */
export function animateToNextFrame(el: HTMLElement, properties: StyleName[] | StyleName, duration: number = defaultAnimationDuration, easing: AnimationEasing = defaultAnimationEasing) {
	if (!el.animate) {
		return Promise.resolve(false)
	}

	stopAnimation(el)

	if (typeof properties === 'string') {
		properties = [properties]
	}

	let startFrame: AnimationFrame = {}
	let style = getComputedStyle(el)

	for (let property of properties) {
		startFrame[property] = (style as any)[property]
	}

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			animateFrom(el, startFrame, duration, easing).then(resolve)
		})
	}) as Promise<boolean>
}


/**
 * Stop executing animation on element.
 * @param el The element to stop animation on.
 */
export function stopAnimation(el: HTMLElement) {
	let animation = ElementAnimationMap.get(el)
	if (animation) {
		animation.cancel()
		el.style.pointerEvents = ''
		ElementAnimationMap.delete(el)
	}
}