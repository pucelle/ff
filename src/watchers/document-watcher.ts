import {untilUpdateComplete} from '@pucelle/lupos'
import {bindCallback} from '../utils'


const Observer = new MutationObserver(fireDocumentChangeLater)
const MutationCallbacks: Array<Function> = []
let willEmitDocumentChange: boolean = false


/** 
 * Bind a callback, to call it after document get changed,
 * or resize/scroll event fired, and also after update complete.
 */
export function bind(callback: Function, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)

	if (MutationCallbacks.length === 0) {
		Observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true})

		window.addEventListener('resize', fireDocumentChangeLater)
		window.addEventListener('wheel', fireDocumentChangeLater)
	}

	MutationCallbacks.push(boundCallback)
}


/** Unbind previously bound callback. */
export function unbind(callback: Function, scope: any = null) {
	let boundCallback = bindCallback(callback, scope)
	let index = MutationCallbacks.indexOf(boundCallback)

	if (index > -1) {
		MutationCallbacks.splice(index, 1)
	}

	if (MutationCallbacks.length === 0) {
		Observer.disconnect()
		window.removeEventListener('resize', fireDocumentChangeLater)
		window.removeEventListener('wheel', fireDocumentChangeLater)
	}
}


/** 
 * Fire mutation events manually.
 * Normally after playing a web transition.
 */
export function trigger() {
	if (MutationCallbacks.length > 0) {
		fireDocumentChangeLater()
	}
}


async function fireDocumentChangeLater() {
	if (!willEmitDocumentChange) {
		willEmitDocumentChange = true
		await untilUpdateComplete()
		fireDocumentChange()
	}
}

function fireDocumentChange() {
	for (let callback of MutationCallbacks) {
		callback()
	}
	willEmitDocumentChange = false
}