import {untilUpdateComplete} from '@pucelle/lupos'
import {bindCallback} from '../utils'


const MutationCallbacks: Array<Function> = []
let observer: MutationObserver | null = null
let willEmitDocumentChange: boolean = false


/** 
 * Bind a callback, to call it after document get changed,
 * or resize/scroll event fired, and also after update complete.
 */
export function bind(callback: Function, scope: any = null) {
	if (!observer) {
		observer = new MutationObserver(fireDocumentChangeLater)
	}

	let boundCallback = bindCallback(callback, scope)

	if (MutationCallbacks.length === 0) {
		observer.observe(document.documentElement, {subtree: true, childList: true, attributes: true})

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
		observer!.disconnect()
		window.removeEventListener('resize', fireDocumentChangeLater)
		window.removeEventListener('wheel', fireDocumentChangeLater)

		// When playing Animation or Transition, computed style is affected.
		window.removeEventListener('transitionend', fireDocumentChangeLater)
		window.removeEventListener('animationend', fireDocumentChangeLater)
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