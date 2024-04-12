import {DependencyTracker} from './dependency-tracker'
import {UpdateQueue} from './update-queue'


/** Contains some utility functions for watching observable properties. */
export namespace Watcher {

	/** 
	 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
	 * Note `callback` can be frequently called in a event loop.
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
			DependencyTracker.trackExecutionOf(assign, onChange)
			callback(newValue, oldValue)
			oldValue = newValue
		}

		function onChange() {
			UpdateQueue.enqueue(update)
		}

		DependencyTracker.trackExecutionOf(assign, onChange)
		oldValue = newValue!

		return function() {
			DependencyTracker.untrack(onChange)
		}
	}


	/**
	 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
	 * Will call `callback` immediately.
	 * Note `callback` can be frequently called in a event loop.
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
			DependencyTracker.trackExecutionOf(assign, onChange)
			callback(newValue, oldValue)
			oldValue = newValue
		}

		function onChange() {
			UpdateQueue.enqueue(update)
		}

		onChange()

		return function() {
			DependencyTracker.untrack(onChange)
		}
	}


	/**
	 * Watch returned value of `fn` and calls `callback` after the value becomes changed.
	 * Calls `callback` for only once.
	 * Note `callback` can be frequently called in a event loop.
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
			DependencyTracker.trackExecutionOf(assign, onChange)
			callback(newValue, oldValue)
			DependencyTracker.untrack(onChange)
		}

		function onChange() {
			update()
		}

		DependencyTracker.trackExecutionOf(assign, onChange)
		oldValue = newValue!

		return function() {
			DependencyTracker.untrack(onChange)
		}
	}


	/** 
	 * Watch returned value of `fn` and calls `callback` after the value becomes `true` like.
	 * Note `callback` can be frequently called in a event loop.
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
			DependencyTracker.trackExecutionOf(assign, onChange)

			if (newValue) {
				callback(newValue)
				DependencyTracker.untrack(onChange)
			}
		}

		function onChange() {
			update()
		}

		DependencyTracker.trackExecutionOf(assign, onChange)

		if (newValue) {
			callback(newValue)
			DependencyTracker.untrack(onChange)
		}

		return function() {
			if (!newValue) {
				DependencyTracker.untrack(onChange)
			}
		}
	}
}