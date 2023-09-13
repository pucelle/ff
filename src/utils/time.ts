export namespace TimeUtils {

	/** Returns a promise which will be resolved after counting timeout for `ms` milliseconds. */
	export function sleep(ms: number = 0) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}
}