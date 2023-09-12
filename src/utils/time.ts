export namespace TimeUtils {

	/** Returns a promise which will be resolved after timeout of `ms` milliseconds. */
	export function sleep(ms: number = 0) {
		return new Promise(resolve => setTimeout(resolve, ms))
	}


	/** 
	 * Returns a promise which will be resolved after window loaded,
	 * or be resolved immediately if window is already loaded.
	 */
	export function untilWindowLoaded() {
		return new Promise(resolve => {
			let entrys = window.performance.getEntriesByType('navigation')
			if (entrys.length > 0 && (entrys[0] as any).loadEventEnd > 0) {
				resolve()
			}
			else {
				window.addEventListener('load', () => resolve(), {once: true})
			}
		}) as Promise<void>
	}


	/** 
	 * Returns a promise which will be resolved after document completed,
	 * or be resolved immediately if document is already completed.
	 */
	export function untilDocumentComplete() {
		return new Promise(resolve => {
			let entrys = window.performance.getEntriesByType('navigation')
			if (entrys.length > 0 && (entrys[0] as any).domContentLoadedEventEnd > 0) {
				resolve()
			}
			else {
				document.addEventListener('DOMContentLoaded', () => resolve(), {once: true})
			}
		}) as Promise<void>
	}
}