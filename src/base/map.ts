import {remove} from './array'



/** 
 * A `key => value[]` type map.
 * Note it assumes that value is never repeative.
 */
 export class GroupArrayMap<K, V> {

	private map: Map<K, V[]> = new Map()

	keys(): Iterable<K> {
		return this.map.keys()
	}

	values(): Iterable<V[]> {
		return this.map.values()
	}

	entites(): Iterable<[K, V[]]> {
		return this.map.entries()
	}

	add(k: K, v: V) {
		let values = this.map.get(k)
		if (!values) {
			values = [v]
			this.map.set(k, values)
		}
		else {
			values.push(v)
		}
	}

	addIf(k: K, v: V) {
		let values = this.map.get(k)
		if (!values) {
			values = [v]
			this.map.set(k, values)
		}
		else if (!values.includes(v)) {
			values.push(v)
		}
	}

	has(k: K): boolean {
		return this.map.has(k)
	}

	hasPair(k: K, v: V): boolean {
		return !!this.map.get(k)?.includes(v)
	}

	get(k: K): V[] | undefined {
		return this.map.get(k)
	}

	getCountOf(k: K) {
		return this.map.get(k)?.length || 0
	}

	delete(k: K, v: V) {
		let values = this.map.get(k)
		if (values) {
			remove(values, v)

			if (values.length === 0) {
				this.map.delete(k)
			}
		}
	}
}


/** 
 * A `key => Set<value>` type map.
 * Good for dynamiclly adding & deleting.
 */
export class GroupSetMap<K, V> {

	private map: Map<K, Set<V>> = new Map()

	keys(): Iterable<K> {
		return this.map.keys()
	}

	values(): Iterable<Set<V>> {
		return this.map.values()
	}

	entites(): Iterable<[K, Set<V>]> {
		return this.map.entries()
	}

	add(k: K, v: V) {
		let values = this.map.get(k)
		if (!values) {
			values = new Set()
			this.map.set(k, values)
		}

		values.add(v)
	}

	has(k: K): boolean {
		return this.map.has(k)
	}

	hasPair(k: K, v: V): boolean {
		return !!this.map.get(k)?.has(v)
	}

	get(k: K): Set<V> | undefined {
		return this.map.get(k)
	}

	getCountOf(k: K) {
		return this.map.get(k)?.size || 0
	}

	delete(k: K, v: V) {
		let values = this.map.get(k)
		if (values) {
			values.delete(v)

			if (values.size === 0) {
				this.map.delete(k)
			}
		}
	}
}


/** Map that indexed by a pair of keys. */
export class DoubleKeysMap<K1, K2, V> {

	private map: Map<K1, Map<K2, V>> = new Map()

	set(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new Map()
			this.map.set(k1, sub)
		}

		sub.set(k2, v)
	}

	has(k1: K1, k2: K2): boolean {
		let sub = this.map.get(k1)
		if (!sub) {
			return false
		}

		return sub.has(k2)
	}

	get(k1: K1, k2: K2): V | undefined {
		let sub = this.map.get(k1)
		if (!sub) {
			return undefined
		}

		return sub.get(k2)
	}

	getSecondMap(k1: K1): Map<K2, V> | undefined {
		return this.map.get(k1)
	}

	getSecondKeys(k1: K1): Iterable<K2> | undefined {
		return this.map.get(k1)?.keys()
	}

	getSecondValues(k1: K1): Iterable<V> | undefined {
		return this.map.get(k1)?.values()
	}

	getCountOf(k1: K1) {
		return this.map.get(k1)?.size || 0
	}

	delete(k1: K1, k2: K2) {
		let sub = this.map.get(k1)
		if (sub) {
			sub.delete(k2)

			if (sub.size === 0) {
				this.map.delete(k1)
			}
		}
	}
}


/** 
 * L -> R
 * R -> L
 */
 export class TwoWayMap<L, R> {

	private lm: Map<L, R> = new Map()
	private rm: Map<R, L> = new Map()

	getLeftSize(): number {
		return this.lm.size
	}

	getRightSize(): number {
		return this.rm.size
	}

	/** 
	 * Both `l` and `r` must not been added before.
	 * You may need to calls `deleteFromLeft` and `deleteFromRight` if you can't ensure this.
	 */
	add(l: L, r: R) {
		this.lm.set(l, r)
		this.rm.set(r, l)
	}

	hasLeft(l: L): boolean {
		return this.lm.has(l)
	}

	hasRight(r: R): boolean {
		return this.rm.has(r)
	}

	getFromLeft(l: L): R | undefined {
		return this.lm.get(l)
	}

	getFromRight(r: R): L | undefined {
		return this.rm.get(r)
	}

	deleteFromLeft(l: L): boolean {
		if (this.hasLeft(l)) {
			this.rm.delete(this.lm.get(l)!)
			this.lm.delete(l)
			return true
		}

		return false
	}

	deleteFromRight(r: R): boolean {
		if (this.hasRight(r)) {
			this.lm.delete(this.rm.get(r)!)
			this.rm.delete(r)
			return true
		}
		
		return false
	}

	getAllLeft(): Iterable<L> {
		return this.lm.keys()
	}

	getAllRight(): Iterable<R> {
		return this.rm.keys()
	}
}
