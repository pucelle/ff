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
			let callbacks = DepMap.getCallbacks(obj, prop)
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
			let callbacks = DepMap.getCallbacks(obj, prop)
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
	DepMap.deleteCallback(boundCallback)
}


/** 
 * Get tracked dependencies and remove them of a refresh callback.
 * After exported, no need to call `untrack`.
 */
export function exportTracked(callback: Function, scope: object | null = null): SetMap<object, PropertyKey> | undefined {
	let boundCallback = bindCallback(callback, scope)
	let tracked = DepMap.getDependencies(boundCallback)
	DepMap.deleteCallback(boundCallback)

	return tracked
}


/** Import and restore tracked dependencies. */
export function importTracked(callback: Function, scope: object | null = null, deps: SetMap<object, PropertyKey>) {
	let boundCallback = bindCallback(callback, scope)
	DepMap.apply(boundCallback, deps)
}


/** 
 * Compute current dependency values for comparing.
 * Remember don't use this too frequently,
 * it will get values by a dynamic property and affect performance.
 */
export function computeTrackingValues(deps: SetMap<object, PropertyKey>): any[] {
	let values: any[] = []

	if (deps) {
		for (let [dep, prop] of deps.flatEntries()) {
			if (prop === '') {
				values.push([...dep as Map<any, any> | Set<any> | any[]])
			}
			else {
				values.push((dep as any)[prop])
			}
		}
	}

	return values
}


/** Compare whether dependency values haven't changed from a previously computed values. */
export function compareTrackingValues(deps: SetMap<object, PropertyKey>, oldValues: any[]): boolean {
	let index = 0

	// Important notes:
	// We assume each value in old values are always
	// have the same position with new values.
	// This is because haven't doing new tracking.

	for (let [dep, prop] of deps.flatEntries()) {
		let oldValue = oldValues[index]
		if (prop === '') {
			
			// May has became `null` or `undefined`.
			if (!dep) {
				return false
			}

			if (dep instanceof Map) {
				if (dep.size !== (oldValue as any[]).length) {
					return false
				}

				let i = 0

				for (let newItem of dep) {
					let oldItem = (oldValue as [any, any][])[i]
					if (oldItem[0] !== newItem[0] || oldItem[1] !== newItem[1]) {
						return false
					}
					i++
				}
			}
			else if (dep instanceof Set) {
				if (dep.size !== (oldValue as any[]).length) {
					return false
				}

				let i = 0
				
				for (let newItem of dep) {
					let oldItem = (oldValue as any[])[i]
					if (oldItem !== newItem) {
						return false
					}
					i++
				}
			}
			else {
				if ((dep as any[]).length !== (oldValue as any[]).length) {
					return false
				}

				for (let i = 0; i < (dep as any[]).length; i++) {
					let oldItem = (oldValue as any[])[i]
					let newItem = (dep as any[])[i]
					if (oldItem !== newItem) {
						return false
					}
				}
			}
		}
		else {
			let newValue = (dep as any)[prop]
			if (newValue !== oldValue) {
				return false
			}
		}

		index++
	}

	return true
}