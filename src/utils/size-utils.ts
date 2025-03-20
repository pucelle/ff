import {toPrecision} from './number-utils'


/** 
 * Format size: `1024 ->1 KB`.
 * `precision` indicates the number count in scientific notation.
 */
export function formatSize(size: number, precision: number = 3) {
	if (size < 1000) {
		return size + ' B'
	}
	else if (size < 1048576) {
		return toPrecision(size / 1024, precision) + ' KB'
	}
	else if (size < 1073741824) {
		return toPrecision(size / 1048576, precision) + ' MB'
	}
	else if (size < 1099511627776) {
		return toPrecision(size / 1073741824, precision) + ' GB'
	}
	else {
		return toPrecision(size / 1099511627776, precision) + ' TB'
	}
}
