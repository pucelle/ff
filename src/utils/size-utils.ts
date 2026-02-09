import {fract, toPrecision} from './number-utils'


/** 
 * Format size: `1024 ->1 KB`.
 * `precision` indicates the number count in scientific notation, e.g., `3.545 -> 3.55`.
 * `fixedPoint` whether use fixed point notation, e.g., `3.5 -> 3.50`.
 */
export function formatSize(size: number, precision: number = 3, fixedPoint: boolean = false) {
	let value: number
	let unit: string

	if (size < 1000) {
		value = size
		unit = 'B'
	}
	else if (size < 1024 * 1000) {
		value = toPrecision(size / 1024, precision)
		unit = 'KB'
	}
	else if (size < 1048576 * 1000) {
		value = toPrecision(size / 1048576, precision)
		unit = 'MB'
	}
	else if (size < 1073741824 * 1000) {
		value = toPrecision(size / 1073741824, precision)
		unit = 'GB'
	}
	else {
		value = toPrecision(size / 1099511627776, precision)
		unit = 'TB'
	}

	if (fixedPoint) {
		return value.toPrecision(precision) + ' ' + unit
	}
	else {
		return value + ' ' + unit
	}
}
