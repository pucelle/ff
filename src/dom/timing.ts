/** 
 * Returns a promise which will be resolved after window loaded,
 * Or resolved immediately if window already loaded.
 */
export function ensureWindowLoaded() {
	return new Promise(resolve => {
		let entrys = window.performance.getEntriesByType("navigation")
		if (entrys.length > 0 && (entrys[0] as any).loadEventEnd > 0) {
			resolve()
		}
		else {
			window.addEventListener('load', () => resolve())
		}
	})
}


/** 
 * Returns a promise which will be resolved after document completed,
 * Or resolved immediately if document already completed.
 */
export function ensureDocumentComplete() {
	return new Promise(resolve => {
		let entrys = window.performance.getEntriesByType("navigation")
		if (entrys.length > 0 && (entrys[0] as any).domContentLoadedEventEnd > 0) {
			resolve()
		}
		else {
			document.addEventListener('DOMContentLoaded', () => resolve(), false)
		}
	})
}