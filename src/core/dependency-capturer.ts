import {DoubleKeysAllWeakMap, DoubleKeysMap, TwoWaySetMap} from 'algorithms'


type Target = object
type Callback = Function
type Dependency = Symbol

interface DependencyItem {
	callback: Callback
	dependencies: Set<Dependency>
}


/** 
 * Note once captured dependencies,
 * The dependencies can't be deleted partly,
 * can only delete fully according to `onDelete`.
 */
export namespace DependencyCapturer {

	/** Caches Dependency <-> Reset Callback. */
	const DependencyMap: TwoWaySetMap<Dependency, Callback> = new TwoWaySetMap()

	/** Caches bound callback. */
	const CallbackBoundMap: DoubleKeysAllWeakMap<Function, Target, Function> = new DoubleKeysAllWeakMap()

	/** Callback and dependencies stack list. */
	const Stack: DependencyItem[] = []

	/** Current callback and dependencies that is doing capturing. */
	let current: DependencyItem | null = null


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
	 * Would suggest running following codes in `try{...}`.
	 * Beware, different places of capturing with same callback,
	 * same scope will overwrite each other.
	 */
	export function startCapture(callback: Callback, scope: Target | null = null) {
		let boundCallback = bindCallback(callback, scope)

		if (current) {
			Stack.push(current)
		}

		current = {
			callback: boundCallback,
			dependencies: new Set(),
		}
	}


	function bindCallback(callback: Callback, scope: Target | null): Callback {
		let boundCallback: Callback
		if (scope) {
			boundCallback = CallbackBoundMap.get(callback, scope)!
			
			if (!boundCallback) {
				boundCallback = callback.bind(scope) as Callback
				CallbackBoundMap.set(callback, scope, boundCallback)
			}
		}
		else {
			boundCallback = callback
		}

		return boundCallback
	}


	/** End capturing dependencies. */
	export function endCapture() {
		if (current!.dependencies.size > 0) {
			DependencyMap.replaceRight(current!.callback, current!.dependencies)
		}
		else {
			DependencyMap.deleteRight(current!.callback)
		}

		if (Stack.length > 0) {
			current = Stack.pop()!
		}
		else {
			current = null
		}
	}


	/** When doing getting property, add a dependency. */
	export function onGet(dep: Dependency) {
		if (current) {
			current.dependencies.add(dep)
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
		let boundCallback = bindCallback(callback, scope)
		DependencyMap.deleteRight(boundCallback)
	}


	/** Create symbols as depedencies for target object. */
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


	/** Create symbols as depedencies for target object and a property. */
	export class PropertiedDepedencyMap {

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