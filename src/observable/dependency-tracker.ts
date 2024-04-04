import {SetMap} from '../structs'
import {bindCallback} from './helpers/bind-callback'
import {DependencyMap} from './helpers/dependency-map'


/** Contains captured depedencies, and the refresh callback it need to call after any depedency get changed. */
interface CapturedDependencies {

	// Refech callback, to call it after any depedency changed.
	refreshCallback: Function

	// Each object and accessed property.
	dependencies: SetMap<object, PropertyKey>
}


/** 
 * Track depedencies when executing.
 * And calls callback when any depedency get changed.
 */
export namespace DependencyTracker {

	/** Caches `Dependency <-> Callback`. */
	const DepMap: DependencyMap = new DependencyMap()

	/** Callback and dependencies stack list. */
	const depStack: CapturedDependencies[] = []

	/** Current callback and dependencies that is doing capturing. */
	let currentDep: CapturedDependencies | null = null


	/** 
	 * Execute `fn`, and captures all dependencies duraing execution,
	 * Will execute `fn` in a `try{...}` statement.
	 * If any dependent object get changed, calls callback.
	 * 
	 * Note for tracking same content, `callback` should keep consitant,
	 * or it would cant replace old tracking.
	 */
	export function trackExecutionOf(fn: () => void, callback: Function, scope: object | null = null) {
		beginTrack(callback, scope)

		try {
			fn()
		}
		catch (err) {
			console.error(err)
		}

		endTrack()
	}


	/** 
	 * Begin to capture dependencies.
	 * Would suggest executing the codes following in a `try{...}` statement.
	 */
	export function beginTrack(callback: Function, scope: object | null = null) {
		let bindedCallback = bindCallback(callback, scope)

		if (currentDep) {
			depStack.push(currentDep)
		}

		currentDep = {
			refreshCallback: bindedCallback,
			dependencies: new SetMap(),
		}
	}


	/** 
	 * End capturing dependencies.
	 * You must ensure to end each capture, or fatul error will happen.
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
	export function onGet(obj: object, prop: PropertyKey = '') {
		if (currentDep) {
			currentDep.dependencies.add(obj, prop)
		}
	}


	/** When doing setting property, notify the dependency is changed. */
	export function onSet(obj: object, prop: PropertyKey = '') {
		let callbacks = DepMap.getRefreshCallbacks(obj, prop)
		if (callbacks) {
			for (let callback of callbacks) {
				callback()
			}
		}
	}


	/** Remove all depedencies of a refresh callback. */
	export function untrack(callback: Function, scope: object | null = null) {
		let bindedCallback = bindCallback(callback, scope)
		DepMap.deleteRefreshCallback(bindedCallback)
	}
}

