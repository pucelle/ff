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
 * Caches Dependencies <=> Refresh Callbacks.
 * Can query all dependencies from a callback,
 * or query which refresh callbacks from a dependency.
 */
export class DependencyMap {

	/** Caches `Refresh Callback -> Dependency -> Dependency Key`. */
	private dependencyMap: ExtendedDoubleKeysWeakSetMap<Function, object, PropertyKey> = new ExtendedDoubleKeysWeakSetMap()

	/** Caches `Dependency -> Dependency Key -> Refresh Callback`. */
	private refreshMap: ExtendedDoubleKeysWeakSetMap<object, PropertyKey, Function> = new ExtendedDoubleKeysWeakSetMap()


	/** When doing getting property, add dependencies. */
	apply(refreshCallback: Function, deps: SetMap<object, PropertyKey>) {
		if (deps.keyCount() > 0) {
			this.updateRefreshMap(refreshCallback, deps)

			// Must after previous step.
			this.dependencyMap.setSecond(refreshCallback, deps)
			
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
			for (let [dep, props] of deps.entries()) {
				let oldProps = oldDep.get(dep)

				if (!oldProps) {
					continue
				}

				for (let prop of oldProps) {
					if (!props.has(prop)) {
						this.refreshMap.delete(dep, prop, c)
					}
				}
			}
		}

		// Add or replace.
		for (let [dep, props] of deps.entries()) {
			this.refreshMap.addByGroupOfSecondKeys(dep, props, c)
		}
	}

	/** Get all refresh callbacks by associated Dependency and key. */
	getRefreshCallbacks(dep: object, prop: PropertyKey): Set<Function> | undefined {
		return this.refreshMap.get(dep, prop)
	}

	/** Delete a refresh callbacks and all of its associated Dependency and keys. */
	deleteRefreshCallback(c: Function) {
		let deps = this.dependencyMap.getSecond(c)
		if (deps) {
			for (let [dep, prop] of deps.flatEntries()) {
				this.refreshMap.delete(dep, prop, c)
			}
		}

		this.dependencyMap.deleteSecondOf(c)
	}
}

