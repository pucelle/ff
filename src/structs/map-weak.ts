import {IterableValueMap, ListMap, SetMap} from './map'


/** `K => Iterable<V>` Map struct. */
export abstract class WeakIterableValueMap<K extends object, V, I extends Iterable<V>> {

	protected map: WeakMap<K, I> = new WeakMap()

	/** Whether has specified key and value pair existed. */
	abstract has(k: K, v: V): boolean

	/** Whether has specified key existed. */
	hasOf(k: K): boolean {
		return this.map.has(k)
	}

	/** Get the count of values by associated key. */
	abstract countOf(k: K): number

	/** Add a key value pair. */
	abstract add(k: K, v: V): void

	/** Add a key and several values. */
	abstract addSeveral(k: K, vs: Iterable<V>): void

	/** Get value list by associated key. */
	get(k: K): I | undefined {
		return this.map.get(k)
	}

	/** Set and replace whole value list by associated key. */
	set(k: K, list: I) {
		return this.map.set(k, list)
	}

	/** Delete a key value pair. */
	abstract delete(k: K, v: V): void

	/** Delete a key and several values. */
	abstract deleteSeveral(k: K, vs: Iterable<V>): void

	/** Delete all values by associated key. */
	deleteOf(k: K) {
		this.map.delete(k)
	}

	/** Clear all the data. */
	clear() {
		this.map = new WeakMap()
	}
}


/** 
 * `K => V[]` Map struct.
 * Good for purely adding.
 */
export class WeakListMap<K extends object, V> extends WeakIterableValueMap<K, V, V[]> {

	has(k: K, v: V): boolean {
		return !!this.map.get(k)?.includes(v)
	}

	countOf(k: K) {
		return this.map.get(k)?.length || 0
	}

	/** 
	 * Add a key and a value.
	 * Note it will not validate whether value exist,
	 * and will add value repeatedly although it exists.
	 */
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

	/** 
	 * Add a key and several values.
	 * Note it will not validate whether value exist,
	 * and will add value repeatedly although it exists.
	 */
	addSeveral(k: K, vs: Iterable<V>) {
		let values = this.map.get(k)
		if (!values) {
			values = [...vs]
			this.map.set(k, values)
		}
		else {
			values.push(...vs)
		}
	}

	/** 
	 * Add a key and a value.
	 * Note it will validate whether value exist, and ignore if value exists.
	 */
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

	/** 
	 * Add a key and a value.
	 * Note it will validate whether value exist, and ignore if value exists.
	 */
	addSeveralIf(k: K, vs: Iterable<V>) {
		let values = this.map.get(k)
		if (!values) {
			values = []
			this.map.set(k, values)
		}

		for (let v of vs) {
			if (!values.includes(v)) {
				values.push(v)
			}
		}
	}

	delete(k: K, v: V) {
		let values = this.map.get(k)
		if (values) {
			let index = values.indexOf(v)
			if (index > -1) {
				values.splice(index, 1)
				
				if (values.length === 0) {
					this.map.delete(k)
				}
			}
		}
	}

	deleteSeveral(k: K, vs: Iterable<V>): void {
		let values = this.map.get(k)
		if (values) {
			for (let v of vs) {
				let index = values.indexOf(v)
				if (index > -1) {
					values.splice(index, 1)
				}
			}
								
			if (values.length === 0) {
				this.map.delete(k)
			}
		}
	}
}


/** 
 * `K => Set<V>` Map Struct.
 * Good for dynamically adding & deleting.
 */
export class WeakSetMap<K extends object, V> extends WeakIterableValueMap<K, V, Set<V>> {

	has(k: K, v: V): boolean {
		return !!this.map.get(k)?.has(v)
	}

	countOf(k: K) {
		return this.map.get(k)?.size || 0
	}

	add(k: K, v: V) {
		let values = this.map.get(k)
		if (!values) {
			values = new Set()
			this.map.set(k, values)
		}

		values.add(v)
	}

	addSeveral(k: K, vs: Iterable<V>) {
		let values = this.map.get(k)
		if (!values) {
			values = new Set(vs)
			this.map.set(k, values)
		}
		else {
			for (let v of vs) {
				values.add(v)
			}
		}
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

	deleteSeveral(k: K, vs: Iterable<V>): void {
		let values = this.map.get(k)
		if (values) {
			for (let v of vs) {
				values.delete(v)
			}
								
			if (values.size === 0) {
				this.map.delete(k)
			}
		}
	}
}


/** 
 * `K1 -> K2 -> V` Map Struct.
 * Index values by a pair of keys.
 * `K1` must be an object type.
 */
export class WeakDoubleKeysMap<K1 extends object, K2, V> {

	private map: WeakMap<K1, Map<K2, V>> = new WeakMap();

	/** Iterate associated secondary keys after known first key. */
	*secondKeysOf(k1: K1): Iterable<K2> {
		let sub = this.map.get(k1)
		if (sub) {
			yield* sub.keys()
		}
	}

	/** Iterate all associated values after known first key. */
	*secondValuesOf(k1: K1): Iterable<V> {
		let sub = this.map.get(k1)
		if (sub) {
			yield* sub.values()
		}
	}

	/** Iterate secondary key and associated value after known first key. */
	*secondEntriesOf(k1: K1): Iterable<[K2, V]> {
		let sub = this.map.get(k1)
		if (sub) {
			yield* sub.entries()
		}
	}

	/** Has associated value by key pair. */
	has(k1: K1, k2: K2): boolean {
		let sub = this.map.get(k1)
		if (!sub) {
			return false
		}

		return sub.has(k2)
	}

	/** Has secondary map existed for first key. */
	hasSecondOf(k1: K1): boolean {
		return this.map.has(k1)
	}

	/** Get the secondary key count by known first key. */
	secondKeyCountOf(k1: K1) {
		return this.map.get(k1)?.size || 0
	}

	/** Get associated value by key pair. */
	get(k1: K1, k2: K2): V | undefined {
		let sub = this.map.get(k1)
		if (!sub) {
			return undefined
		}

		return sub.get(k2)
	}

	/** Set key pair and value. */
	set(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new Map()
			this.map.set(k1, sub)
		}

		sub.set(k2, v)
	}

	/** Delete all the associated values by key pair. */
	delete(k1: K1, k2: K2) {
		let sub = this.map.get(k1)
		if (sub) {
			sub.delete(k2)

			if (sub.size === 0) {
				this.map.delete(k1)
			}
		}
	}

	/** Delete all associated secondary keys and values by first key. */
	deleteOf(k1: K1) {
		this.map.delete(k1)
	}

	/** Clear all the data. */
	clear() {
		this.map = new WeakMap()
	}
}


/** 
 * `K1 -> K2 -> V` Map Struct.
 * Index single value by a pair of object keys.
 * Both `K1` and `K2` must be an object type.
 */
export class WeakerDoubleKeysMap<K1 extends object, K2 extends object, V> {

	private map: WeakMap<K1, WeakMap<K2, V>> = new WeakMap();

	/** Has associated value by key pair. */
	has(k1: K1, k2: K2): boolean {
		let sub = this.map.get(k1)
		if (!sub) {
			return false
		}

		return sub.has(k2)
	}

	/** Has secondary map existed for first key. */
	hasSecondOf(k1: K1): boolean {
		return this.map.has(k1)
	}

	/** Get associated value by key pair. */
	get(k1: K1, k2: K2): V | undefined {
		let sub = this.map.get(k1)
		if (!sub) {
			return undefined
		}

		return sub.get(k2)
	}

	/** Set key pair and associated value. */
	set(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new Map()
			this.map.set(k1, sub)
		}

		sub.set(k2, v)
	}

	/** Delete all the associated values by key pair. */
	delete(k1: K1, k2: K2) {
		let sub = this.map.get(k1)
		if (sub) {
			sub.delete(k2)
		}
	}

	/** Delete all associated secondary keys and values by first key. */
	deleteOf(k1: K1) {
		this.map.delete(k1)
	}

	/** Clear all the data. */
	clear() {
		this.map = new WeakMap()
	}
}


/** 
 * `K1 -> K2 -> Iterable<V>` Map Struct.
 * Index a group of values by a pair of keys.
 * `K1` must be an object type.
 */
export abstract class WeakDoubleKeysIterableValueMap<K1 extends object, K2, V, I extends Iterable<V>, M extends IterableValueMap<K2, V, I>> {

	protected map: WeakMap<K1, M> = new WeakMap()

	/** Create sub map. */
	protected abstract createSubMap(): M

	/** Iterate associated secondary keys by first key. */
	*secondKeysOf(k1: K1): Iterable<K2> {
		let sub = this.map.get(k1)
		if (sub) {
			yield* sub.keys()
		}
	}

	/** Iterate all associated values by first key. */
	*secondValuesOf(k1: K1): Iterable<V> {
		let sub = this.map.get(k1)
		if (sub) {
			yield* sub.values()
		}
	}

	/** Iterate all associated values by key pair. */
	*values(k1: K1, k2: K2): Iterable<V> {
		let values = this.get(k1, k2)
		if (values) {
			yield* values
		}
	}

	/** Iterate secondary key and value list by first key. */
	*secondEntriesOf(k1: K1): Iterable<[K2, I]> {
		let sub = this.map.get(k1)
		if (sub) {
			yield* sub.entries()
		}
	}

	/** Iterate secondary key and each associated value after flatted. */
	*secondFlatEntriesOf(k1: K1): Iterable<[K2, V]> {
		let sub = this.map.get(k1)
		if (sub) {
			for (let [k2, list] of sub.entries()) {
				for (let v of list) {
					yield [k2, v]
				}
			}
		}
	}

	/** Has key pair and associated value existed. */
	has(k1: K1, k2: K2, v: V): boolean {
		let sub = this.map.get(k1)
		if (!sub) {
			return false
		}

		return sub.has(k2, v)
	}

	/** Has key pair existed. */
	hasKeys(k1: K1, k2: K2): boolean {
		let sub = this.map.get(k1)
		if (!sub) {
			return false
		}

		return sub.hasOf(k2)
	}

	/** Has secondary map associated by first key. */
	hasSecondOf(k1: K1): boolean {
		return this.map.has(k1)
	}

	/** Get the associated value count by key pair. */
	countOf(k1: K1, k2: K2) {
		return this.map.get(k1)?.countOf(k2)
	}

	/** Get the associated secondary key count by first key. */
	secondKeyCountOf(k1: K1) {
		return this.map.get(k1)?.keyCount()
	}

	/** Get associated value list by key pair. */
	get(k1: K1, k2: K2): I | undefined {
		let sub = this.map.get(k1)
		if (!sub) {
			return undefined
		}

		return sub.get(k2)
	}

	/** Get the map consist of second keys and values from the first key. */
	getSecond(k1: K1): M | undefined {
		return this.map.get(k1)
	}

	/** Replace with first key and associated map of second keys and values. */
	setSecond(k1: K1, m: M) {
		this.map.set(k1, m)
	}

	/** Add key pair and value. */
	add(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = this.createSubMap()
			this.map.set(k1, sub)
		}

		sub.add(k2, v)
	}

	/** Delete a key pair and associated value. */
	delete(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (sub) {
			sub.delete(k2, v)

			if (sub.keyCount() === 0) {
				this.map.delete(k1)
			}
		}
	}

	/** Delete all associated values by key pair. */
	deleteKeys(k1: K1, k2: K2) {
		let sub = this.map.get(k1)
		if (sub) {
			sub.deleteOf(k2)

			if (sub.keyCount() === 0) {
				this.map.delete(k1)
			}
		}
	}

	/** Delete associated secondary keys and values by first key. */
	deleteSecondOf(k1: K1) {
		this.map.delete(k1)
	}
	
	/** Clear all the data. */
	clear() {
		this.map = new WeakMap()
	}
}


/** 
 * `K1 -> K2 -> V[]` Map Struct.
 * Index value list by a pair of keys.
 * `K1` must be an object type.
 */
export class WeakDoubleKeysListMap<K1 extends object, K2, V> extends WeakDoubleKeysIterableValueMap<K1, K2, V, V[], ListMap<K2, V>> {

	protected createSubMap(): ListMap<K2, V> {
		return new ListMap()
	}

	/** Add key pair and associated value if it's not exist yet. */
	addIf(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1) as ListMap<K2, V>
		if (!sub) {
			sub = this.createSubMap()
			this.map.set(k1, sub)
		}

		sub.addIf(k2, v)
	}	
}


/** 
 * `K1 -> K2 -> Set<V>` Map Struct.
 * Index a set of values by a pair of keys.
 * `K1` must be an object type.
 */
export class WeakDoubleKeysSetMap<K1 extends object, K2, V> extends WeakDoubleKeysIterableValueMap<K1, K2, V, Set<V>, SetMap<K2, V>> {

	protected createSubMap(): SetMap<K2, V> {
		return new SetMap()
	}
}


/**
 * Map struct that can query from left to right and right to left.
 * `L -> R`
 * `R -> L`
 * `L` and `R` must be object type.
 */
export class WeakTwoWayMap<L extends object, R extends object> {

	private lm: WeakMap<L, R> = new WeakMap()
	private rm: WeakMap<R, L> = new WeakMap()

	/** Has a specified left key. */
	hasLeft(l: L): boolean {
		return this.lm.has(l)
	}

	/** Has a specified right key. */
	hasRight(r: R): boolean {
		return this.rm.has(r)
	}

	/** Get right key by a left key. */
	getByLeft(l: L): R | undefined {
		return this.lm.get(l)
	}

	/** Get left key by a right key. */
	getByRight(r: R): L | undefined {
		return this.rm.get(r)
	}

	/** 
	 * Set a left and right key pair.
	 * Note if left or right key is exist, would cause overwrite.
	 */
	set(l: L, r: R) {
		this.lm.set(l, r)
		this.rm.set(r, l)
	}

	/** Delete all associated right values by left key. */
	deleteLeft(l: L) {
		if (this.hasLeft(l)) {
			this.rm.delete(this.lm.get(l)!)
			this.lm.delete(l)
		}
	}

	/** Delete all associated left values by right key. */
	deleteRight(r: R) {
		if (this.hasRight(r)) {
			this.lm.delete(this.rm.get(r)!)
			this.rm.delete(r)
		}
	}

	/** Clear all the data. */
	clear() {
		this.lm = new WeakMap()
		this.rm = new WeakMap()
	}
}


/**
 * Map Struct that can query from left to right group and right to left group.
 * `L -> Iterable<R>`
 * `R -> Iterable<L>`
 * `L` and `R` must be object type.
 */
export abstract class WeakTwoWayIterableValueMap<L extends object, R extends object, LI extends Iterable<L>, RI extends Iterable<R>> {

	protected lm: WeakIterableValueMap<L, R, RI>
	protected rm: WeakIterableValueMap<R, L, LI>

	constructor() {
		this.lm = this.createSubMap()
		this.rm = this.createSubMap()
	}

	/** Make the `IterableValueMap`. */
	protected abstract createSubMap(): WeakIterableValueMap<any, any, any>

	/** Has a left and right key pair. */
	has(l: L, r: R): boolean {
		return this.lm.has(l, r)
	}

	/** Whether have a left key. */
	hasLeft(l: L): boolean {
		return this.lm.hasOf(l)
	}

	/** Whether have a right key. */
	hasRight(r: R): boolean {
		return this.rm.hasOf(r)
	}

	/** Get associated right keys by a left key. */
	getByLeft(l: L): RI | undefined {
		return this.lm.get(l)
	}

	/** Get associated left keys by a right key. */
	getByRight(r: R): LI | undefined {
		return this.rm.get(r)
	}

	/** Add a left and right key pair. */
	add(l: L, r: R) {
		this.lm.add(l, r)
		this.rm.add(r, l)
	}

	/** Delete a left and right key pair. */
	delete(l: L, r: R) {
		this.lm.delete(l, r)
		this.rm.delete(r, l)
	}

	/** Delete by left key. */
	deleteLeft(l: L) {
		let rs = this.getByLeft(l)
		if (rs) {
			for (let r of rs) {
				this.rm.delete(r, l)
			}

			this.lm.deleteOf(l)
		}
	}

	/** Delete by right key. */
	deleteRight(r: R) {
		let ls = this.getByRight(r)
		if (ls) {
			for (let l of ls) {
				this.lm.delete(l, r)
			}

			this.rm.deleteOf(r)
		}
	}

	/** Replace left and all it's associated right keys. */
	setLeft(l: L, rs: RI) {
		let oldRs = this.lm.get(l)

		if (oldRs) {
			for (let r of rs) {
				if (!this.iterableHas(oldRs, r)) {
					this.rm.add(r, l)
				}
			}

			for (let r of oldRs) {
				if (!this.iterableHas(rs, r)) {
					this.rm.delete(r, l)
				}
			}
		}
		else {
			for (let r of rs) {
				this.rm.add(r, l)
			}
		}

		this.lm.set(l, rs)
	}

	/** Replace right and all it's associated left keys. */
	setRight(r: R, ls: LI) {
		let oldLs = this.rm.get(r)

		if (oldLs) {
			for (let l of ls) {
				if (!this.iterableHas(oldLs, l)) {
					this.lm.add(l, r)
				}
			}

			for (let l of oldLs) {
				if (!this.iterableHas(ls, l)) {
					this.lm.delete(l, r)
				}
			}
		}
		else {
			for (let l of ls) {
				this.lm.add(l, r)
			}
		}

		this.rm.set(r, ls)
	}

	protected abstract iterableHas(lrs: LI | RI, lr: L | R): boolean

	/** Clear all the data. */
	clear() {
		this.lm = this.createSubMap()
		this.rm = this.createSubMap()
	}
}


/**
 * Map struct that can query from left to right list and right to left list.
 * `L -> R[]`
 * `R -> L[]`
 * `L` and `R` must be object type.
 */
export class WeakTwoWayListMap<L extends object, R extends object> extends WeakTwoWayIterableValueMap<L, R, L[], R[]> {

	protected declare lm: WeakListMap<L, R>
	protected declare rm: WeakListMap<R, L>

	protected createSubMap(): WeakListMap<L, R> {
		return new WeakListMap()
	}

	protected iterableHas(lrs: L[] | R[], lr: L | R) {
		return lrs.includes(lr as any)
	}
	
	/** 
	 * Add a left and right value as a pair.
	 * Note it will not validate whether value exist, and will add it repeatly if it exists.
	 */
	add(l: L, r: R) {
		this.lm.add(l, r)
		this.rm.add(r, l)
	}

	/** 
	 * Add a left and right value as a pair.
	 * Note it will validate whether value exist, and do nothing if it exists.
	 */
	addIf(l: L, r: R) {
		this.lm.addIf(l, r)
		this.rm.addIf(r, l)
	}	
}


/**
 * Map struct that can query from left to right set and right to left set.
 * `L -> Set<R>`
 * `R -> Set<L>`
 * `L` and `R` must be object type.
 */
export class WeakTwoWaySetMap<L extends object, R extends object> extends WeakTwoWayIterableValueMap<L, R, Set<L>, Set<R>> {

	protected declare lm: WeakSetMap<L, R>
	protected declare rm: WeakSetMap<R, L>

	protected createSubMap(): WeakSetMap<L, R> {
		return new WeakSetMap()
	}

	protected iterableHas(lrs: Set<L> | Set<R>, lr: L | R) {
		return lrs.has(lr as any)
	}
}