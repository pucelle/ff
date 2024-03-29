import {WeakerDoubleKeysMap, SetMap} from '../structs'
import {DependencyMap} from './dependency-map'


/** Contains captured depedencies, and the refresh callback it need to call after any depedency get changed. */
interface CapturedDependencies {

	// Refech callback, to call it after any depedency changed.
	refreshCallback: Function

	// Each object and accessed property.
	dependencies: SetMap<object, PropertyKey>
}


const EmptyPropertyKey = 'EMPTY_KEY'


/** 
 * Capture depedencies when executing.
 * And calls callback when any depedency get changed.
 */
export namespace DependencyCapturer {

	/** Caches `Dependency <-> Callback`. */
	const DepMap: DependencyMap = new DependencyMap()

	/** Caches all binded callbacks, `Callback -> Scope -> Binded Callback`. */
	const BindedCallbackMap: WeakerDoubleKeysMap<Function, object, Function> = new WeakerDoubleKeysMap()

	/** Callback and dependencies stack list. */
	const depStack: CapturedDependencies[] = []

	/** Current callback and dependencies that is doing capturing. */
	let currentDep: CapturedDependencies | null = null


	/** 
	 * Execute `fn`, and captures all dependencies duraing execution,
	 * Will execute `fn` in a `try{...}` statement.
	 */
	export function captureExecutionOf(fn: () => void, callback: Function, scope: object | null = null) {
		startCapture(callback, scope)

		try {
			fn()
		}
		catch (err) {
			console.error(err)
		}

		endCapture()
	}


	/** 
	 * Begin to capture dependencies.
	 * Would suggest executing the codes following in a `try{...}` statement.
	 */
	export function startCapture(callback: Function, scope: object | null = null) {
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
	 * Bind a callback and a scope to get a new callback function.
	 * Will cache reuslt and always get same result for same parameters.
	 */
	function bindCallback(callback: Function, scope: object | null): Function {
		if (!scope) {
			return callback
		}

		let bindedCallback = BindedCallbackMap.get(callback, scope)!			
		if (!bindedCallback) {
			bindedCallback = callback.bind(scope) as Function
			BindedCallbackMap.set(callback, scope, bindedCallback)
		}

		return bindedCallback
	}


	/** 
	 * End capturing dependencies.
	 * You must ensure to end each capture, or fatul error will happen.
	 */
	export function endCapture() {
		DepMap.apply(currentDep!.refreshCallback, currentDep!.dependencies)

		if (depStack.length > 0) {
			currentDep = depStack.pop()!
		}
		else {
			currentDep = null
		}
	}


	/** When doing getting property, add a dependency. */
	export function onGet(obj: object, prop: PropertyKey = EmptyPropertyKey) {
		if (currentDep) {
			currentDep.dependencies.add(obj, prop)
		}
	}


	/** When doing setting property, notify the dependency is changed. */
	export function onSet(obj: object, prop: PropertyKey = EmptyPropertyKey) {
		let callbacks = DepMap.getRefreshCallbacks(obj, prop)
		if (callbacks) {
			for (let callback of callbacks) {
				callback()
			}
		}
	}


	/** Remove all depedencies of a refresh callback. */
	export function release(callback: Function, scope: object | null = null) {
		let bindedCallback = bindCallback(callback, scope)
		DepMap.deleteRefreshCallback(bindedCallback)
	}
}

