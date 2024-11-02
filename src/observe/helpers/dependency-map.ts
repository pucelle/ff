import {WeakPairKeysSetMap, SetMap} from '../../structs'


class ExtendedPairKeysWeakSetMap<K1 extends object, K2, V> extends WeakPairKeysSetMap<K1, K2, V> {
	
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
	private dependencyMap: ExtendedPairKeysWeakSetMap<Function, object, PropertyKey> = new ExtendedPairKeysWeakSetMap()

	/** Caches `Dependency -> Dependency Key -> Refresh Callback`. */
	private refreshMap: ExtendedPairKeysWeakSetMap<object, PropertyKey, Function> = new ExtendedPairKeysWeakSetMap()


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

	/** 
	 * Compute current dependency values for comparing.
	 * Remember don't use this too frequently,
	 * it will get values by a dynamic property and affect performance.
	 */
	computeValues(c: Function): any[] {
		let deps = this.dependencyMap.getSecond(c)
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

	/** Compare whether dependency values has changed from a previously computed values. */
	compareValues(c: Function, oldValues: any[]): boolean {
		let deps = this.dependencyMap.getSecond(c)
		let index = 0

		// Important notes:
		// We assume each value in old values are always
		// have the same position with new values.
		// This is because haven't doing new tracking.

		if (deps) {
			for (let [dep, prop] of deps.flatEntries()) {
				let oldValue = oldValues[index]
				if (prop === '') {
					
					// May has became `null` or `undefined`.
					if (!dep) {
						return false
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
			}

			index++
		}

		return false
	}
}

