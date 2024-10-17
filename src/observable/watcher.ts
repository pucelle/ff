import {trackExecution, untrack} from './dependency-tracker'
import * as UpdateQueue from './update-queue'


/** 
 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
 * Note `callback` can only be called once in a event loop.
 */
export function createWatch<T>(
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
		trackExecution(assign, onChange)
		
		if (newValue !== oldValue) {
			callback(newValue, oldValue)
			oldValue = newValue
		}
	}

	function onChange() {
		UpdateQueue.enqueueUpdate(update)
	}

	trackExecution(assign, onChange)
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
export function createImmediateWatch<T>(
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
		trackExecution(assign, onChange)

		if (newValue !== oldValue) {
			callback(newValue, oldValue)
			oldValue = newValue
		}
	}

	function onChange() {
		UpdateQueue.enqueueUpdate(update)
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
export function createOnceWatch<T>(
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
		trackExecution(assign, onChange)

		if (newValue !== oldValue) {
			callback(newValue, oldValue)
			untrack(onChange)
		}
	}

	function onChange() {
		update()
	}

	trackExecution(assign, onChange)
	oldValue = newValue!

	return function() {
		untrack(onChange)
	}
}


/** 
 * Watch returned value of `fn` and calls `callback` after the value becomes `true` like.
 * Note `callback` can only be called once in a event loop.
 */
export function createWatchUntil<T>(
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
		trackExecution(assign, onChange)

		if (newValue) {
			callback(newValue)
			untrack(onChange)
		}
	}

	function onChange() {
		update()
	}

	trackExecution(assign, onChange)

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
