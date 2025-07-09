import {promiseWithResolves} from '@pucelle/lupos'


/** Whether supports fullscreen. */
export function isSupported(): boolean {
	return document.fullscreenEnabled ?? false
}


/** Whether in fullscreen state. */
export function isInFullscreen(): boolean {
	return document.fullscreen ?? false
}


/** Request fullscreen, returns a promise, which will be resolved by request success state. */
export async function request(el: Element = document.body): Promise<boolean> {
	try {
		el.requestFullscreen()
		return await untilFullscreenChange()
	}
	catch (err) {
		return false
	}
}


/** Exit fullscreen, returns a promise, resolved by whether exit successfully. */
export async function exit(): Promise<boolean> {
	try {
		if (isInFullscreen()) {
			document.exitFullscreen()
			return !await untilFullscreenChange()
		}

		return true
	}
	catch (err) {
		return false
	}
}


/** Returns a promise which will be resolved after entering fullscreen. */
export async function untilEnter() {
	if (!isInFullscreen()) {
		await untilFullscreenChange()
	}
}


/** Returns a promise which will be resolved after exiting fullscreen. */
export async function untilExit() {
	if (isInFullscreen()) {
		await untilFullscreenChange()
	}
}


/** Returns a promise which will be resolved by whether in fullscreen state after fullscreen state changed. */
function untilFullscreenChange(): Promise<boolean> {
	let {promise, resolve, reject} = promiseWithResolves<boolean>()
	
	function onChange() {
		resolve(isInFullscreen())
		document.removeEventListener('fullscreenchange', onChange, false)
		document.removeEventListener('fullscreenerror', onError, false)
	}

	function onError(e: Event) {
		reject(e)
		document.removeEventListener('fullscreenchange', onChange, false)
		document.removeEventListener('fullscreenerror', onError, false)
	}

	document.addEventListener('fullscreenchange', onChange, false)
	document.addEventListener('fullscreenerror', onError, false)
	
	return promise
}
