/** `K => Iterable<V>` Map Struct. */
export abstract class IterableValueMap<K, V, I extends Iterable<V>> {

	protected map: Map<K, I> = new Map()

	/** Iterate all keys. */
	keys(): Iterable<K> {
		return this.map.keys()
	}

	/** Iterate all values in list type. */
	valueLists(): Iterable<I> {
		return this.map.values()
	}

	/** Iterate all values. */
	*values(): Iterable<V> {
		for (let list of this.map.values()) {
			yield *list
		}
	}

	/** Iterate each key and associated value list. */
	entries(): Iterable<[K, I]> {
		return this.map.entries()
	}

	/** Iterate each key and each associated value after flatted. */
	*flatEntries(): Iterable<[K, V]> {
		for (let [key, values] of this.map.entries()) {
			for (let value of values) {
				yield [key, value]
			}
		}
	}

	/** Has specified key and value pair existed. */
	abstract has(k: K, v: V): boolean

	/** Has specified key existed. */
	hasOf(k: K): boolean {
		return this.map.has(k)
	}

	/** Get the count of values by associated key. */
	abstract countOf(k: K): number

	/** Get the count of all the keys. */
	keyCount(): number {
		return this.map.size
	}

	/** Add a key value pair. */
	abstract add(k: K, v: V): void

	/** Get value list by assocated key. */
	get(k: K): I | undefined {
		return this.map.get(k)
	}

	/** Set and replace whole value list by assocated key. */
	set(k: K, list: I) {
		return this.map.set(k, list)
	}

	/** Delete a key value pair. */
	abstract delete(k: K, v: V): void

	/** Delete all values by assocated key. */
	deleteOf(k: K) {
		this.map.delete(k)
	}

	/** Clear all the data. */
	clear() {
		this.map = new Map()
	}
}


/** 
 * `K => V[]` Map Struct.
 * Good for purely adding.
 */
export class ListMap<K, V> extends IterableValueMap<K, V, V[]> {

	has(k: K, v: V): boolean {
		return !!this.map.get(k)?.includes(v)
	}

	countOf(k: K) {
		return this.map.get(k)?.length || 0
	}

	/** 
	 * Add a key and a value.
	 * Note it will not validate whether value exist, and will add value repeatly although it exists.
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
}


/** 
 * `K => Set<V>` Map Struct.
 * Good for dynamiclly adding & deleting.
 */
export class SetMap<K, V> extends IterableValueMap<K, V, Set<V>> {

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


/** 
 * `K1 -> K2 -> V` Map Struct.
 * Index each value by a pair of keys.
 */
export class DoubleKeysMap<K1, K2, V> {

	private map: Map<K1, Map<K2, V>> = new Map()

	/** Iterate first keys. */
	firstKeys(): Iterable<K1> {
		return this.map.keys()
	}

	/** Iterate assocated secondary keys after known first key. */
	*secondKeysOf(k1: K1): Iterable<K2> {
		let sub = this.map.get(k1)
		if (sub) {
			yield *sub.keys()
		}
	}

	/** Iterate all associated values after known first key. */
	*secondValuesOf(k1: K1): Iterable<V> {
		let sub = this.map.get(k1)
		if (sub) {
			yield *sub.values()
		}
	}

	/** Iterate all the values existed. */
	*values(): Iterable<V> {
		for (let secondary of this.map.values()) {
			yield *secondary.values()
		}
	}

	/** Iterate first key and assocated secondary map. */
	entries(): Iterable<[K1, Map<K2, V>]> {
		return this.map.entries()
	}

	/** Iterate each key pairs and each value after flatted. */
	*flatEntries(): Iterable<[K1, K2, V]> {
		for (let [k1, sub] of this.map.entries()) {
			for (let [k2, v] of sub.entries()) {
				yield [k1, k2, v]
			}
		}
	}

	/** Iterate secondary key and associated value after known first key. */
	*secondEntriesOf(k1: K1): Iterable<[K2, V]> {
		let sub = this.map.get(k1)
		if (sub) {
			yield *sub.entries()
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
	
	/** Get the count of all the first keys. */
	firstCount(): number {
		return this.map.size
	}

	/** Get the secondary key count by first key. */
	secondCountOf(k1: K1) {
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
		this.map = new Map()
	}
}



/** 
 * `K1 -> K2 -> Iterable<V>` Map Struct.
 * Index a group of values by a pair of keys.
 */
export abstract class DoubleKeysIterableValueMap<K1, K2, V, I extends Iterable<V>, M extends IterableValueMap<K2, V, I>> {

	protected map: Map<K1, M> = new Map()

	/** Create sub map. */
	protected abstract createSubMap(): M

	/** Iterate first keys. */
	firstKeys(): Iterable<K1> {
		return this.map.keys()
	}

	/** Iterate associated secondary keys by first key. */
	*secondKeysOf(k1: K1): Iterable<K2> {
		let sub = this.map.get(k1)
		if (sub) {
			yield *sub.keys()
		}
	}

	/** Iterate all associated values by first key. */
	*secondValuesOf(k1: K1): Iterable<V> {
		let sub = this.map.get(k1)
		if (sub) {
			yield *sub.values()
		}
	}

	/** Iterate all associated values by key pair. */
	*values(k1: K1, k2: K2): Iterable<V> {
		let values = this.get(k1, k2)
		if (values) {
			yield *values
		}
	}

	/** Iterate each key pairs and associated value list. */
	*entries(): Iterable<[K1, K2, I]> {
		for (let [k1, sub] of this.map.entries()) {
			for (let [k2, list] of sub.entries()) {
				yield [k1, k2, list]
			}
		}
	}

	/** Iterate each key pairs and each value after flatted. */
	*flatEntries(): Iterable<[K1, K2, V]> {
		for (let [k1, sub] of this.map.entries()) {
			for (let [k2, list] of sub.entries()) {
				for (let v of list) {
					yield [k1, k2, v]
				}
			}
		}
	}

	/** Iterate secondary key and value list by first key. */
	*secondEntriesOf(k1: K1): Iterable<[K2, I]> {
		let sub = this.map.get(k1)
		if (sub) {
			yield *sub.entries()
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

	/** Has key pair and assocated value existed. */
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

	/** Has secondary map assocated by first key. */
	hasSecondOf(k1: K1): boolean {
		return this.map.has(k1)
	}

	/** Get the assocated value count by key pair. */
	countOf(k1: K1, k2: K2) {
		return this.map.get(k1)?.countOf(k2)
	}

	/** Get the assocated secondary key count by first key. */
	secondCountOf(k1: K1) {
		return this.map.get(k1)?.keyCount()
	}

	/** Get assocated value list by key pair. */
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

	/** Add key pair and associated value. */
	add(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = this.createSubMap()
			this.map.set(k1, sub)
		}

		sub.add(k2, v)
	}

	/** Delete a key pair and assocated value. */
	delete(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (sub) {
			sub.delete(k2, v)

			if (sub.keyCount() === 0) {
				this.map.delete(k1)
			}
		}
	}

	/** Delete all assocated values by key pair. */
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
		this.map = new Map()
	}
}


/** 
 * `K1 -> K2 -> V[]` Map Struct.
 * Index a value list by a pair of keys.
 */
export class DoubleKeysListMap<K1, K2, V> extends DoubleKeysIterableValueMap<K1, K2, V, V[], ListMap<K2, V>> {

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
 * Index a value set by a pair of keys.
 */
export class DoubleKeysSetMap<K1, K2, V> extends DoubleKeysIterableValueMap<K1, K2, V, Set<V>, SetMap<K2, V>> {

	protected createSubMap(): SetMap<K2, V> {
		return new SetMap()
	}
}


/**
 * Map Struct that can query from left to right and right to left.
 * `L -> R`
 * `R -> L`
 */
export class TwoWayMap<L, R> {

	private lm: Map<L, R> = new Map()
	private rm: Map<R, L> = new Map()

	/** Iterate all left keys. */
	leftKeys(): Iterable<L> {
		return this.lm.keys()
	}

	/** Iterate all right keys. */
	rightKeys(): Iterable<R> {
		return this.rm.keys()
	}

	/** Iterate each left and right key pairs. */
	entries(): Iterable<[L, R]> {
		return this.lm.entries()
	}

	/** Has a specified left key. */
	hasLeft(l: L): boolean {
		return this.lm.has(l)
	}

	/** Has a specified right key. */
	hasRight(r: R): boolean {
		return this.rm.has(r)
	}

	/** Get count of all left keys. */
	leftKeyCount(): number {
		return this.lm.size
	}

	/** Get count of all right keys. */
	rightKeyCount(): number {
		return this.rm.size
	}

	/** Get right key by a left key. */
	getLeft(l: L): R | undefined {
		return this.lm.get(l)
	}

	/** Get left key by a right key. */
	getRight(r: R): L | undefined {
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
		this.lm = new Map()
		this.rm = new Map()
	}
}


/**
 * Map Struct that can query from left to right group and right to left group.
 * `L -> Iterable<R>`
 * `R -> Iterable<L>`
 */
export abstract class TwoWayIterableValueMap<L, R, LI extends Iterable<L>, RI extends Iterable<R>> {

	protected lm: IterableValueMap<L, R, RI>
	protected rm: IterableValueMap<R, L, LI>

	constructor() {
		this.lm = this.createSubMap()
		this.rm = this.createSubMap()
	}

	/** Make the `IterableValueMap`. */
	protected abstract createSubMap(): IterableValueMap<any, any, any>

	/** Returns total count of left keys. */
	leftKeyCount(): number {
		return this.lm.keyCount()
	}

	/** Returns total count of right keys. */
	rightKeyCount(): number {
		return this.rm.keyCount()
	}

	/** Iterate all left keys. */
	leftKeys(): Iterable<L> {
		return this.lm.keys()
	}

	/** Iterate all right keys. */
	rightKeys(): Iterable<R> {
		return this.rm.keys()
	}

	/** Iterate associated right keys by left key. */
	*rightValuesOf(l: L): Iterable<R> {
		let rs = this.lm.get(l)
		if (rs) {
			yield *rs
		} 
	}

	/** Iterate associated left keys by right key. */
	*leftValuesOf(r: R): Iterable<L> {
		let ls = this.rm.get(r)
		if (ls) {
			yield *ls
		} 
	}

	/** Iterate left and it's assocated right value list. */
	leftEntries(): Iterable<[L, RI]> {
		return this.lm.entries()
	}

	/** Iterate right and it's assocated left value list. */
	rightEntries(): Iterable<[R, LI]> {
		return this.rm.entries()
	}
	
	/** Iterate each left and right key pairs. */
	flatEntries(): Iterable<[L, R]> {
		return this.lm.flatEntries()
	}

	/** Has a left and right key pair. */
	has(l: L, r: R): boolean {
		return this.lm.has(l, r)
	}

	/** Has a left key. */
	hasLeft(l: L): boolean {
		return this.lm.hasOf(l)
	}

	/** Has a right key. */
	hasRight(r: R): boolean {
		return this.rm.hasOf(r)
	}

	/** Get count of associated right keys by a left key. */
	countOfLeft(l: L): number {
		return this.lm.countOf(l)
	}

	/** Get count of associated left keys by a right key. */
	countOfRight(r: R): number {
		return this.rm.countOf(r)
	}

	/** Get associated right key by a left key. */
	getLeft(l: L): RI | undefined {
		return this.lm.get(l)
	}

	/** Get associated left key by a right key. */
	getRight(r: R): LI | undefined {
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
		let rs = this.getLeft(l)
		if (rs) {
			for (let r of rs) {
				this.rm.delete(r, l)
			}

			this.lm.deleteOf(l)
		}
	}

	/** Delete by right key. */
	deleteRight(r: R) {
		let ls = this.getRight(r)
		if (ls) {
			for (let l of ls) {
				this.lm.delete(l, r)
			}

			this.rm.deleteOf(r)
		}
	}

	/** Replace left and all it's assocated right keys. */
	replaceLeft(l: L, rs: RI) {
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

	/** Replace right and all it's assocated left keys. */
	replaceRight(r: R, ls: LI) {
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
 * Map Struct that can query from left to right list and right to left list.
 * `L -> R[]`
 * `R -> L[]`
 */
export class TwoWayListMap<L, R> extends TwoWayIterableValueMap<L, R, L[], R[]> {

	protected declare lm: ListMap<L, R>
	protected declare rm: ListMap<R, L>

	protected createSubMap(): ListMap<L, R> {
		return new ListMap()
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
 * Map Struct that can query from left to right set and right to left set.
 * `L -> Set<R>`
 * `R -> Set<L>`
 */
export class TwoWaySetMap<L, R> extends TwoWayIterableValueMap<L, R, Set<L>, Set<R>> {

	protected declare lm: SetMap<L, R>
	protected declare rm: SetMap<R, L>

	protected createSubMap(): SetMap<L, R> {
		return new SetMap()
	}

	protected iterableHas(lrs: Set<L> | Set<R>, lr: L | R) {
		return lrs.has(lr as any)
	}
}