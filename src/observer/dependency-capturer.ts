import {DoubleKeysBothWeakMap, DoubleKeysMap, TwoWaySetMap} from '../structs'


type Target = object
type Callback = Function
type Dependency = Symbol | object

/** Contains captured depedencies, and the callback it need to call after any depedency get changed. */
interface CapturedDependencies {
	callback: Callback
	dependencies: Set<Dependency>
}


/** 
 * Capture depedencies when executing.
 * And calls callback when any depedency get changed.
 */
export namespace DependencyCapturer {

	/** Caches `Dependency <-> Callback`. */
	const DependencyMap: TwoWaySetMap<Dependency, Callback> = new TwoWaySetMap()

	/** Caches all binded callbacks, `Callback -> Scope -> Binded Callback`. */
	const BindedCallbackMap: DoubleKeysBothWeakMap<Function, Target, Function> = new DoubleKeysBothWeakMap()

	/** Callback and dependencies stack list. */
	const depStack: CapturedDependencies[] = []

	/** Current callback and dependencies that is doing capturing. */
	let currentDep: CapturedDependencies | null = null


	/** 
	 * Capture dependencies within the execution period of `fn`,
	 * and execute it in a `try{...}`.
	 */
	export function captureExecution(fn: () => void, callback: Callback, scope: Target | null = null) {
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
	 * Would suggest running following codes in a `try{...}` statement.
	 * Beware of capturing with same callback and same scope in different places,
	 * which will overwrite each other.
	 */
	export function startCapture(callback: Callback, scope: Target | null = null) {
		let bindedCallback = bindCallback(callback, scope)

		if (currentDep) {
			depStack.push(currentDep)
		}

		currentDep = {
			callback: bindedCallback,
			dependencies: new Set(),
		}
	}


	function bindCallback(callback: Callback, scope: Target | null): Callback {
		let bindedCallback: Callback
		if (scope) {
			bindedCallback = BindedCallbackMap.get(callback, scope)!
			
			if (!bindedCallback) {
				bindedCallback = callback.bind(scope) as Callback
				BindedCallbackMap.set(callback, scope, bindedCallback)
			}
		}
		else {
			bindedCallback = callback
		}

		return bindedCallback
	}


	/** 
	 * End capturing dependencies.
	 * You must ensure to ending each capturing, or fatul error will happen.
	 */
	export function endCapture() {
		if (currentDep!.dependencies.size > 0) {
			DependencyMap.replaceRight(currentDep!.callback, currentDep!.dependencies)
		}
		else {
			DependencyMap.deleteRight(currentDep!.callback)
		}

		if (depStack.length > 0) {
			currentDep = depStack.pop()!
		}
		else {
			currentDep = null
		}
	}


	/** When doing getting property, add a dependency. */
	export function onGet(dep: Dependency) {
		if (currentDep) {
			currentDep.dependencies.add(dep)
		}
	}


	/** When doing setting property, notify the dependency is changed. */
	export function onSet(dep: Dependency) {
		let callbacks = DependencyMap.getLeft(dep)
		if (callbacks) {
			for (let callback of callbacks) {
				callback()
			}
		}
	}


	/** Remove all depedencies of callback. */
	export function remove(callback: Callback, scope: Target | null = null) {
		let bindedCallback = bindCallback(callback, scope)
		DependencyMap.deleteRight(bindedCallback)
	}


	/** Cache symbols as depedencies by target object. */
	export class DepedencyMap {

		private map: Map<Target, Dependency> = new Map()

		/** Get a symbol for target object. */
		get(target: Target): Dependency {
			let symbol = this.map.get(target)
			if (!symbol) {
				symbol = Symbol()
				this.map.set(target, symbol)
			}
	
			return symbol
		}
	}


	/** Cache symbols as depedencies by target object and a associated property name. */
	export class SubDepedencyMap {

		private map: DoubleKeysMap<Target, PropertyKey, Dependency> = new DoubleKeysMap()

		/** Get a symbol for target object. */
		get(target: Target, property: PropertyKey): Dependency {
			let symbol = this.map.get(target, property)
			if (!symbol) {
				symbol = Symbol()
				this.map.set(target, property, symbol)
			}
	
			return symbol
		}
	}
}