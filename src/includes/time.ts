/**
 * Returns a promise which will be resolved after `ms` milliseconds.
 * @param ms Specify the sleep time in milliseconds.
 */

export function sleep(ms: number = 0) {
	return new Promise(resolve => setTimeout(resolve, ms))
}