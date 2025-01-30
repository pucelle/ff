import {SetMap} from '../structs'
import {bindCallback} from '../utils'
import {DependencyMap} from './helpers/dependency-map'


// This file was exported as `DependencyTracker` before,
// but it's apis are used frequently by Lupos Compiler,
// so finally it export all members directly.


/** Caches `Dependency <=> Callback`. */
const DepMap: DependencyMap = new DependencyMap()

/** Tracker stack list. */
const trackerStack: DependencyTracker[] = []

/** Current callback and dependencies that is doing capturing. */
let currentTracker: DependencyTracker | null = null


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
 * Please note, `callback` get called when any property of tracking object get changed,
 * not only the accurate property that we are tracking by `props` of
 * `trackGet(o, props)` and `trackSet(o, props)`.
 * 
 * If wanting detailed tracking, please use tracker object returned by `endTrack`
 * to do snapshot comparing.
 */
export function beginTrack(callback: Function, scope: object | null = null) {
	let boundCallback = bindCallback(callback, scope)

	if (currentTracker) {
		trackerStack.push(currentTracker)
	}

	currentTracker = new DependencyTracker(boundCallback)
}


/** 
 * End capturing dependencies.
 * You must ensure to end each capture, or fatal error will happen.
 */
export function endTrack(): DependencyTracker {
	currentTracker!.apply()

	if (trackerStack.length > 0) {
		currentTracker = trackerStack.pop()!
	}
	else {
		currentTracker = null
	}

	return currentTracker!
}


/** When doing getting property, add a dependency. */
export function trackGet(obj: object, ...props: PropertyKey[]) {
	if (currentTracker) {
		currentTracker.dependencies.addSeveral(obj, props)
	}
}


/** 
 * When need to visit all properties and descendant properties recursively,
 * e.g., `JSON.stringify(...)`.
 * Note you this api can't be generated by compiler, you must use it manually.
 */
export function trackGetDeeply(obj: object, maxDepth = 10) {
	if (maxDepth === 0) {
		return
	}

	// Array.
	if (Array.isArray(obj)) {
		trackGet(obj, '')

		for (let item of obj) {
			if (item && typeof item === 'object') {
				trackGetDeeply(item, maxDepth - 1)
			}
		}
	}

	// Plain object.
	else {
		for (let key of Object.keys(obj)) {
			trackGet(obj, key)

			let item = (obj as any)[key]
			if (item && typeof item === 'object') {
				trackGetDeeply(item, maxDepth - 1)
			}
		}
	}
}


/** When doing setting property, notify the dependency is changed. */
export function trackSet(obj: object, ...props: PropertyKey[]) {
	for (let prop of props) {
		let callbacks = DepMap.getCallbacks(obj, prop)
		if (callbacks) {
			for (let callback of callbacks) {
				callback()
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
 * Contains captured dependencies, and the refresh callback it need to call after any dependency get changed.
 * Can also use it to compute a dependency values snapshot, and to compare it later.
 */
export class DependencyTracker {

	// Refresh callback, to call it after any dependency changed.
	readonly callback: Function

	// Each object and accessed property.
	readonly dependencies: SetMap<object, PropertyKey> = new SetMap()

	constructor(callback: Function) {
		this.callback = callback
	}

	/** Apply or restore current tracking to global tracking. */
	apply() {
		DepMap.apply(this.callback, this.dependencies)
	}

	/** Remove current tracking from global tracking.  */
	remove() {
		DepMap.deleteCallback(this.callback)
	}

	/** 
	 * Compute current dependency values as a snapshot for comparing them later.
	 * Remember don't use this too frequently,
	 * it will get values by dynamic properties and affect performance.
	 */
	makeSnapshot(): any[] {
		let values: any[] = []

		for (let [dep, prop] of this.dependencies.flatEntries()) {
			if (prop === '') {
				values.push([...dep as Map<any, any> | Set<any> | any[]])
			}
			else {
				values.push((dep as any)[prop])
			}
		}

		return values
	}

	/** Compare whether dependency values have changed from a previously computed snapshot. */
	compareSnapshot(oldValues: any[]): boolean {
		let index = 0

		// Important notes:
		// We assume each value in old values are always
		// have the same position with new values.
		// This is because haven't doing new tracking.

		for (let [dep, prop] of this.dependencies.flatEntries()) {
			let oldValue = oldValues[index]
			if (prop === '') {
				
				// May has became `null` or `undefined`.
				if (!dep) {
					return true
				}

				if (dep instanceof Map) {
					if (dep.size !== (oldValue as any[]).length) {
						return true
					}

					let i = 0

					for (let newItem of dep) {
						let oldItem = (oldValue as [any, any][])[i]
						if (oldItem[0] !== newItem[0] || oldItem[1] !== newItem[1]) {
							return true
						}
						i++
					}
				}
				else if (dep instanceof Set) {
					if (dep.size !== (oldValue as any[]).length) {
						return true
					}

					let i = 0
					
					for (let newItem of dep) {
						let oldItem = (oldValue as any[])[i]
						if (oldItem !== newItem) {
							return true
						}
						i++
					}
				}
				else {
					if ((dep as any[]).length !== (oldValue as any[]).length) {
						return true
					}

					for (let i = 0; i < (dep as any[]).length; i++) {
						let oldItem = (oldValue as any[])[i]
						let newItem = (dep as any[])[i]
						if (oldItem !== newItem) {
							return true
						}
					}
				}
			}
			else {
				let newValue = (dep as any)[prop]
				if (newValue !== oldValue) {
					return true
				}
			}

			index++
		}

		return false
	}
}
