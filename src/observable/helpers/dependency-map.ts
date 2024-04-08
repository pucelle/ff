import {WeakDoubleKeysSetMap, SetMap} from '../../structs'


class ExtendedDoubleKeysWeakSetMap<K1 extends object, K2, V> extends WeakDoubleKeysSetMap<K1, K2, V> {
	
	/** 
	 * Add key1, group of key2, and value.
	 * Improves a little performance compare with `add`.
	 */
	addByGroupOfSecondKeys(k1: K1, k2s: Set<K2>, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = this.createSubMap()
			this.map.set(k1, sub)
		}

		for (let k2 of k2s) {
			sub.add(k2, v)
		}
	}
}


/** 
 * Caches Depedencies <=> Refresh Callbacks.
 * Can query all dependencies from a callback,
 * or query which refresh callbacks from a depedency.
 */
export class DependencyMap {

	/** Caches `Refresh Callback -> Dependency`. */
	private dependencyMap: ExtendedDoubleKeysWeakSetMap<Function, object, PropertyKey> = new ExtendedDoubleKeysWeakSetMap()

	/** Caches `Dependency -> Refresh Callback`. */
	private refreshMap: ExtendedDoubleKeysWeakSetMap<object, PropertyKey, Function> = new ExtendedDoubleKeysWeakSetMap()


	/** When doing getting property, add a dependency. */
	apply(refreshCallback: Function, dependencies: SetMap<object, PropertyKey>) {
		if (dependencies.keyCount() > 0) {
			this.updateRefreshMap(refreshCallback, dependencies)

			// Must after previous step.
			this.dependencyMap.setSecond(refreshCallback, dependencies)
			
		}
		else {
			this.dependencyMap.deleteSecondOf(refreshCallback)
		}

	}
	
	/** Update Refresh Callback Map by a Dependency Map item. */
	private updateRefreshMap(c: Function, deps: SetMap<object, PropertyKey>) {
		let oldDep = this.dependencyMap.getSecond(c)

		// Clean not existed.
		if (oldDep) {
			for (let [obj, props] of deps.entries()) {
				let oldProps = oldDep.get(obj)

				if (!oldProps) {
					continue
				}

				for (let prop of oldProps) {
					if (!props.has(prop)) {
						this.refreshMap.delete(obj, prop, c)
					}
				}
			}
		}

		// Add or replace.
		for (let [obj, props] of deps.entries()) {
			this.refreshMap.addByGroupOfSecondKeys(obj, props, c)
		}
	}

	/** Get all refresh callbacks by associated object and property. */
	getRefreshCallbacks(obj: object, prop: PropertyKey): Set<Function> | undefined {
		return this.refreshMap.get(obj, prop)
	}

	/** Delete a refresh callbacks and all of its associated object and properties. */
	deleteRefreshCallback(c: Function) {
		let deps = this.dependencyMap.getSecond(c)
		if (deps) {
			for (let [obj, prop] of deps.flatEntries()) {
				this.refreshMap.delete(obj, prop, c)
			}
		}

		this.dependencyMap.deleteSecondOf(c)
	}
}

