import {trackExecutionOf, untrack} from './dependency-tracker'
import * as UpdateQueue from './update-queue'


/** 
 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
 * Note `callback` can only be called once in a event loop.
 */
export function watch<T>(
	fn: () => T,
	callback: (newValue: T, oldValue: T | undefined) => void,
	scope: object | null = null
): () => void
{
	let oldValue: T | undefined = undefined
	let newValue: T

	if (scope) {
		callback = callback.bind(scope)
	}

	function assign() {
		newValue = fn()
	}

	function update() {
		trackExecutionOf(assign, onChange)
		
		if (newValue !== oldValue) {
			callback(newValue, oldValue)
			oldValue = newValue
		}
	}

	function onChange() {
		UpdateQueue.enqueue(update)
	}

	trackExecutionOf(assign, onChange)
	oldValue = newValue!

	return function() {
		untrack(onChange)
	}
}


/**
 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
 * Will call `callback` immediately.
 * Note `callback` can only be called once in a event loop.
 */
export function watchImmediately<T>(
	fn: () => T,
	callback: (newValue: T, oldValue: T | undefined) => void,
	scope: object | null = null
): () => void
{
	let oldValue: T | undefined = undefined
	let newValue: T

	if (scope) {
		callback = callback.bind(scope)
	}

	function assign() {
		newValue = fn()
	}

	function update() {
		trackExecutionOf(assign, onChange)

		if (newValue !== oldValue) {
			callback(newValue, oldValue)
			oldValue = newValue
		}
	}

	function onChange() {
		UpdateQueue.enqueue(update)
	}

	update()

	return function() {
		untrack(onChange)
	}
}


/**
 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
 * Calls `callback` for only once.
 * Note `callback` can only be called once in a event loop.
 */
export function watchOnce<T>(
	fn: () => T,
	callback: (newValue: T, oldValue: T | undefined) => void,
	scope: object | null = null
): () => void
{
	let oldValue: T | undefined = undefined
	let newValue: T

	if (scope) {
		callback = callback.bind(scope)
	}

	function assign() {
		newValue = fn()
	}

	function update() {
		trackExecutionOf(assign, onChange)

		if (newValue !== oldValue) {
			callback(newValue, oldValue)
			untrack(onChange)
		}
	}

	function onChange() {
		update()
	}

	trackExecutionOf(assign, onChange)
	oldValue = newValue!

	return function() {
		untrack(onChange)
	}
}


/** 
 * Watch returned value of `fn` and calls `callback` after the value becomes `true` like.
 * Note `callback` can only be called once in a event loop.
 */
export function watchUntil<T>(
	fn: () => T,
	callback: (trueValue: T) => void,
	scope: object | null = null
): () => void {
	let newValue: T | undefined = undefined

	if (scope) {
		callback = callback.bind(scope)
	}

	function assign() {
		newValue = fn()
	}

	function update() {
		trackExecutionOf(assign, onChange)

		if (newValue) {
			callback(newValue)
			untrack(onChange)
		}
	}

	function onChange() {
		update()
	}

	trackExecutionOf(assign, onChange)

	if (newValue) {
		callback(newValue)
		untrack(onChange)
	}

	return function() {
		if (!newValue) {
			untrack(onChange)
		}
	}
}
