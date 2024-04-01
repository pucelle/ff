import {DependencyTracker} from './dependency-tracker'


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
		DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		oldValue = newValue
	}

	DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)
	oldValue = newValue!

	return () => {
		DependencyTracker.untrack(depCapCallback)
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
		DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		oldValue = newValue
	}

	depCapCallback()

	return () => {
		DependencyTracker.untrack(depCapCallback)
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
		DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)
		callback(newValue, oldValue)
		DependencyTracker.untrack(depCapCallback)
	}

	DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)
	oldValue = newValue!

	return () => {
		DependencyTracker.untrack(depCapCallback)
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
		DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)

		if (newValue!) {
			callback(newValue)
			DependencyTracker.untrack(depCapCallback)
		}
	}

	DependencyTracker.trackExecutionOf(assignValueFn, depCapCallback)

	if (newValue!) {
		callback(newValue)
		DependencyTracker.untrack(depCapCallback)
	}

	return () => {
		DependencyTracker.untrack(depCapCallback)
	}
}

