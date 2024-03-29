import {DependencyCapturer} from './dependency-capturer'


/** Watch returned value of `fn` and calls `callback` after the value becomes changed. */
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
		DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		oldValue = newValue
	}

	DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)
	oldValue = newValue!

	return () => {
		DependencyCapturer.release(depCapCallback)
	}
}


/**
 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
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
		DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		oldValue = newValue
	}

	depCapCallback()

	return () => {
		DependencyCapturer.release(depCapCallback)
	}
}


/**
 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
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
		DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		DependencyCapturer.release(depCapCallback)
	}

	DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)
	oldValue = newValue!

	return () => {
		DependencyCapturer.release(depCapCallback)
	}
}


/** Watch returned value of `fn` and calls `callback` after the value becomes `true` like. */
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
		DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)

		if (newValue!) {
			callback(newValue)
			DependencyCapturer.release(depCapCallback)
		}
	}

	DependencyCapturer.captureExecutionOf(assignValueFn, depCapCallback)

	if (newValue!) {
		callback(newValue)
		DependencyCapturer.release(depCapCallback)
	}

	return () => {
		DependencyCapturer.release(depCapCallback)
	}
}

