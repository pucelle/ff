import {SetMap} from '../structs'
import {bindCallback} from '../utils'
import {DependencyMap} from './helpers/dependency-map'


// This file was exported as `DependencyTracker` before,
// but it's apis are used frequently by Lupos Compiler,
// so finally it export all members directly.


/** Contains captured dependencies, and the refresh callback it need to call after any dependency get changed. */
interface CapturedDependencies {

	// Refresh callback, to call it after any dependency changed.
	refreshCallback: Function

	// Each object and accessed property.
	dependencies: SetMap<object, PropertyKey>
}


/** Caches `Dependency <=> Callback`. */
const DepMap: DependencyMap = new DependencyMap()

/** Callback and dependencies stack list. */
const depStack: CapturedDependencies[] = []

/** Current callback and dependencies that is doing capturing. */
let currentDep: CapturedDependencies | null = null


/** 
 * Execute `fn`, and captures all dependencies during execution,
 * Will execute `fn` in a `try{...}` statement.
 * If any dependent object get changed, calls callback.
 * 
 * Note for tracking same content, `callback` should keep consistent,
 * or it would cant replace old tracking.
 */
export function trackExecution(fn: () => void, callback: Function, scope: object | null = null) {
	beginTrack(callback, scope)

	try {
		fn()
	}
	catch (err) {
		console.error(err)
	}
	finally {
		endTrack()
	}
}


/** 
 * Begin to capture dependencies.
 * Would suggest executing the codes following in a `try{...}` statement.
 */
export function beginTrack(callback: Function, scope: object | null = null) {
	let boundCallback = bindCallback(callback, scope)

	if (currentDep) {
		depStack.push(currentDep)
	}

	currentDep = {
		refreshCallback: boundCallback,
		dependencies: new SetMap(),
	}
}


/** 
 * End capturing dependencies.
 * You must ensure to end each capture, or fatal error will happen.
 */
export function endTrack() {
	DepMap.apply(currentDep!.refreshCallback, currentDep!.dependencies)

	if (depStack.length > 0) {
		currentDep = depStack.pop()!
	}
	else {
		currentDep = null
	}
}


/** When doing getting property, add a dependency. */
export function trackGet(obj: object, ...props: PropertyKey[]) {
	if (currentDep) {
		currentDep.dependencies.addSeveral(obj, props)
	}
}


/** When doing setting property, notify the dependency is changed. */
export function trackSet(obj: object, ...props: PropertyKey[]) {
	if (props.length > 1) {
		let callbackSet: Set<Function> = new Set()

		for (let prop of props) {
			let callbacks = DepMap.getRefreshCallbacks(obj, prop)
			if (callbacks) {
				for (let callback of callbacks) {
					callbackSet.add(callback)
				}
			}
		}

		for (let callback of callbackSet) {
			callback()
		}
	}
	else {
		for (let prop of props) {
			let callbacks = DepMap.getRefreshCallbacks(obj, prop)
			if (callbacks) {
				for (let callback of callbacks) {
					callback()
				}
			}
		}
	}
}


/** Remove all dependencies of a refresh callback. */
export function untrack(callback: Function, scope: object | null = null) {
	let boundCallback = bindCallback(callback, scope)
	DepMap.deleteRefreshCallback(boundCallback)
}


/** 
 * Compute current dependency values for comparing.
 * Remember don't use this too frequently,
 * it will get values by a dynamic property and affect performance.
 */
export function computeTrackingValues(callback: Function, scope: object | null = null): any[] {
	let boundCallback = bindCallback(callback, scope)
	return DepMap.computeValues(boundCallback)
}


/** Compare whether dependency values has changed from a previously computed values. */
export function compareTrackingValues(callback: Function, scope: object | null = null, oldValues: any[]): boolean {
	let boundCallback = bindCallback(callback, scope)
	return DepMap.compareValues(boundCallback, oldValues)
}