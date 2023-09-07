import {DependencyCapturer} from './dependency-capturer'


/** Watch returned value of `fn` and calls `callback` after the value changed. */
export function watch<T>(
	fn: () => T,
	callback: (newValue: T, oldValue: T | undefined) => void,
	scope: object | null = null
): () => void
{
	let oldValue: T | undefined = undefined
	let newValue: T
	let assignValueFn = () => { newValue = fn() }

	if (scope) {
		callback = callback.bind(scope)
	}

	let depCapCallback = () => {
		DependencyCapturer.captureExecution(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		oldValue = newValue
	}

	DependencyCapturer.captureExecution(assignValueFn, depCapCallback)
	oldValue = newValue!

	return () => {
		DependencyCapturer.remove(depCapCallback)
	}
}


/**
 * Watch returned value of `fn` and calls `callback` after the value changed.
 * Will call `callback` immediately.
 */
export function watchImmediately<T>(
	fn: () => T,
	callback: (newValue: T, oldValue: T | undefined) => void,
	scope: object | null = null
): () => void
{
	let oldValue: T | undefined = undefined
	let newValue: T
	let assignValueFn = () => {newValue = fn()}

	if (scope) {
		callback = callback.bind(scope)
	}

	let depCapCallback = () => {
		DependencyCapturer.captureExecution(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		oldValue = newValue
	}

	depCapCallback()

	return () => {
		DependencyCapturer.remove(depCapCallback)
	}
}


/**
 * Watch returned value of `fn` and calls `callback` after the value changed.
 * Calls `callback` for only once.
 */
export function watchOnce<T>(
	fn: () => T,
	callback: (newValue: T, oldValue: T | undefined) => void,
	scope: object | null = null
): () => void
{
	let oldValue: T | undefined = undefined
	let newValue: T
	let assignValueFn = () => { newValue = fn() }

	if (scope) {
		callback = callback.bind(scope)
	}

	let depCapCallback = () => {
		DependencyCapturer.captureExecution(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		DependencyCapturer.remove(depCapCallback)
	}

	DependencyCapturer.captureExecution(assignValueFn, depCapCallback)
	oldValue = newValue!

	return () => {
		DependencyCapturer.remove(depCapCallback)
	}
}


/** Watch returned value of `fn` and calls `callback` after the value becomes true like. */
export function watchUntil<T>(
	fn: () => T,
	callback: (trueValue: T) => void,
	scope: object | null = null
): () => void {
	let newValue: T | undefined = undefined
	let assignValueFn = () => { newValue = fn() }

	if (scope) {
		callback = callback.bind(scope)
	}

	let depCapCallback = () => {
		DependencyCapturer.captureExecution(assignValueFn, depCapCallback)

		if (newValue!) {
			callback(newValue)
			DependencyCapturer.remove(depCapCallback)
		}
	}

	DependencyCapturer.captureExecution(assignValueFn, depCapCallback)

	if (newValue!) {
		callback(newValue)
		DependencyCapturer.remove(depCapCallback)
	}

	return () => {
		DependencyCapturer.remove(depCapCallback)
	}
}

