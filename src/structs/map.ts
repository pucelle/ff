import {MethodsObserved} from '@pucelle/lupos'


/** 
 * `K => V[]` Map Struct.
 * Good for purely adding.
 */
export class ListMap<K, V> implements MethodsObserved<
	'keys' | 'valueLists' | 'values' | 'entries' | 'flatEntries' | 'has'
		| 'hasKey' | 'countOf' | 'valueCount' | 'keyCount' | 'get' | 'clone',
	'add' | 'addSeveral' | 'addIf' | 'addSeveralIf' | 'set' | 'delete'
		| 'deleteSeveral' | 'deleteOf' | 'clear'
> {

	protected map: Map<K, V[]> = new Map()

	/** Iterate all keys. */
	keys(): Iterable<K> {
		return this.map.keys()
	}

	/** Iterate all values in list type. */
	valueLists(): Iterable<V[]> {
		return this.map.values()
	}

	/** Iterate all values. */
	*values(): Iterable<V> {
		for (let list of this.map.values()) {
			yield* list
		}
	}

	/** Iterate each key and associated value list. */
	entries(): Iterable<[K, V[]]> {
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
	has(k: K, v: V): boolean {
		return !!this.map.get(k)?.includes(v)
	}

	/** Has specified key existed. */
	hasKey(k: K): boolean {
		return this.map.has(k)
	}

	/** Get the count of values by associated key. */
	countOf(k: K) {
		return this.map.get(k)?.length || 0
	}

	/** Get the count of all the values. */
	valueCount(): number {
		let count = 0

		for (let values of this.map.values()) {
			count += values.length
		}

		return count
	}

	/** Get the count of all the keys. */
	keyCount(): number {
		return this.map.size
	}

	/** Get value list by associated key. */
	get(k: K): V[] | undefined {
		return this.map.get(k)
	}

	/** Clone to get a new list map with same data. */
	clone(): ListMap<K, V> {
		let cloned = new ListMap<K, V>()

		for (let [key, list] of this.map.entries()) {
			cloned.map.set(key, [...list])
		}

		return cloned
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
	addSeveral(k: K, vs: V[]) {
		if (vs.length === 0) {
			return
		}

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
	addSeveralIf(k: K, vs: V[]) {
		if (vs.length === 0) {
			return
		}

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

	/** Set and replace whole value list by associated key. */
	set(k: K, list: V[]) {
		return this.map.set(k, list)
	}

	/** Delete a key value pair. */
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

	/** Delete a key and several values. */
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

	/** Delete all values by associated key. */
	deleteOf(k: K) {
		this.map.delete(k)
	}

	/** Clear all the data. */
	clear() {
		this.map = new Map()
	}
}


/** 
 * `K => Set<V>` Map Struct.
 * Good for dynamically adding & deleting.
 */
export class SetMap<K, V> implements MethodsObserved<
	'keys' | 'valueLists' | 'values' | 'entries' | 'flatEntries' | 'has'
		| 'hasKey' | 'countOf' | 'valueCount' | 'keyCount' | 'get' | 'clone',
	'add' | 'addSeveral' | 'set' | 'delete'
		| 'deleteSeveral' | 'deleteOf' | 'clear'
> {

	protected map: Map<K, Set<V>> = new Map()

	/** Iterate all keys. */
	keys(): Iterable<K> {
		return this.map.keys()
	}

	/** Iterate all values in list type. */
	valueLists(): Iterable<Set<V>> {
		return this.map.values()
	}

	/** Iterate all values. */
	*values(): Iterable<V> {
		for (let list of this.map.values()) {
			yield* list
		}
	}

	/** Iterate each key and associated value list. */
	entries(): Iterable<[K, Set<V>]> {
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
	has(k: K, v: V): boolean {
		return !!this.map.get(k)?.has(v)
	}

	/** Has specified key existed. */
	hasKey(k: K): boolean {
		return this.map.has(k)
	}

	/** Get the count of values by associated key. */
	countOf(k: K) {
		return this.map.get(k)?.size || 0
	}

	/** Get the count of all the values. */
	valueCount(): number {
		let count = 0

		for (let values of this.map.values()) {
			count += values.size
		}

		return count
	}

	/** Get the count of all the keys. */
	keyCount(): number {
		return this.map.size
	}

	/** Get value list by associated key. */
	get(k: K): Set<V> | undefined {
		return this.map.get(k)
	}

	/** Clone to get a new list map with same data. */
	clone(): SetMap<K, V> {
		let cloned = new SetMap<K, V>()

		for (let [key, set] of this.map.entries()) {
			cloned.map.set(key, new Set(set))
		}

		return cloned
	}

	/** Add a key value pair. */
	add(k: K, v: V) {
		let values = this.map.get(k)
		if (!values) {
			values = new Set()
			this.map.set(k, values)
		}

		values.add(v)
	}

	/** Add a key and several values. */
	addSeveral(k: K, vs: V[]) {
		if (vs.length === 0) {
			return
		}

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

	/** Set and replace whole value list by associated key. */
	set(k: K, list: Set<V>) {
		return this.map.set(k, list)
	}

	/** Delete a key value pair. */
	delete(k: K, v: V) {
		let values = this.map.get(k)
		if (values) {
			values.delete(v)

			if (values.size === 0) {
				this.map.delete(k)
			}
		}
	}

	/** Delete a key and several values. */
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

	/** Delete all values by associated key. */
	deleteOf(k: K) {
		this.map.delete(k)
	}

	/** Clear all the data. */
	clear() {
		this.map = new Map()
	}
}


/** 
 * `K1 -> K2 -> V` Map Struct.
 * Index each value by a pair of keys.
 */
export class PairKeysMap<K1, K2, V> implements MethodsObserved<
	'firstKeys' | 'secondKeysOf' | 'secondValuesOf' | 'values' | 'entries' | 'flatEntries'
		| 'secondEntriesOf' | 'has' | 'hasFirstKey' | 'firstKeyCount' | 'secondKeyCountOf'
		| 'get' | 'getSecond' | 'clone',
	'set' | 'setSecond' | 'delete' | 'deleteOf' | 'clear'
> {

	private map: Map<K1, Map<K2, V>> = new Map()

	/** Iterate first keys. */
	firstKeys(): Iterable<K1> {
		return this.map.keys()
	}

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

	/** Iterate all the values existed. */
	*values(): Iterable<V> {
		for (let secondary of this.map.values()) {
			yield* secondary.values()
		}
	}

	/** Iterate first key and associated secondary map. */
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
	hasFirstKey(k1: K1): boolean {
		return this.map.has(k1)
	}
	
	/** Get the count of all the first keys. */
	firstKeyCount(): number {
		return this.map.size
	}

	/** Get the secondary key count by first key. */
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

	/** Get the map consist of second keys and values from the first key. */
	getSecond(k1: K1): Map<K2, V> | undefined {
		return this.map.get(k1)
	}

	/** Clone to get a new pair keys map with same data. */
	clone(): PairKeysMap<K1, K2, V> {
		let cloned = new PairKeysMap<K1, K2, V>()

		for (let [key, map] of this.map.entries()) {
			cloned.map.set(key, new Map(map))
		}

		return cloned
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

	/** Replace with first key and associated map of second keys and values. */
	setSecond(k1: K1, m: Map<K2, V>) {
		this.map.set(k1, m)
	}

	/** Delete associated value by key pair. */
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
 * `K1 -> K2 -> V[]` Map Struct.
 * Index a value list by a pair of keys.
 */
export class PairKeysListMap<K1, K2, V> implements MethodsObserved<
	'firstKeys' | 'secondKeysOf' | 'secondValuesOf' | 'values' | 'entries' | 'flatEntries'
		| 'secondEntriesOf' | 'has' | 'hasFirstKey' | 'firstKeyCount' | 'secondKeyCountOf'
		| 'get' | 'getSecond' | 'clone',
	'set' | 'setSecond' | 'add' | 'addSeveral' | 'addIf' | 'addSeveralIf' | 'delete'
		| 'deleteKeys' | 'deleteOf' | 'clear'
> {

	protected map: Map<K1, ListMap<K2, V>> = new Map()

	/** Iterate first keys. */
	firstKeys(): Iterable<K1> {
		return this.map.keys()
	}

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

	/** Iterate each key pairs and associated value list. */
	*entries(): Iterable<[K1, K2, V[]]> {
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
	*secondEntriesOf(k1: K1): Iterable<[K2, V[]]> {
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

		return sub.hasKey(k2)
	}

	/** Has secondary map associated by first key. */
	hasFirstKey(k1: K1): boolean {
		return this.map.has(k1)
	}

	/** Get the associated value count by key pair. */
	countOf(k1: K1, k2: K2) {
		return this.map.get(k1)?.countOf(k2)
	}

	/** Get the count of all the first keys. */
	firstKeyCount(): number {
		return this.map.size
	}

	/** Get the associated secondary key count by first key. */
	secondKeyCountOf(k1: K1) {
		return this.map.get(k1)?.keyCount()
	}

	/** Get associated value list by key pair. */
	get(k1: K1, k2: K2): V[] | undefined {
		let sub = this.map.get(k1)
		if (!sub) {
			return undefined
		}

		return sub.get(k2)
	}

	/** Get the map consist of second keys and values from the first key. */
	getSecond(k1: K1): ListMap<K2, V> | undefined {
		return this.map.get(k1)
	}

	/** Clone to get a new pair keys list map with same data. */
	clone(): PairKeysListMap<K1, K2, V> {
		let cloned = new PairKeysListMap<K1, K2, V>()

		for (let [key, map] of this.map.entries()) {
			cloned.map.set(key, map.clone())
		}

		return cloned
	}

	/** Set key pair and associated values. */
	set(k1: K1, k2: K2, v: V[]) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new ListMap()
			this.map.set(k1, sub)
		}

		sub.set(k2, v)
	}

	/** Replace with first key and associated map of second keys and values. */
	setSecond(k1: K1, m: ListMap<K2, V>) {
		this.map.set(k1, m)
	}

	/** Add key pair and associated value. */
	add(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new ListMap()
			this.map.set(k1, sub)
		}

		sub.add(k2, v)
	}

	/** Add a key pair and several values. */
	addSeveral(k1: K1, k2: K2, vs: V[]) {
		if (vs.length === 0) {
			return
		}
		
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new ListMap()
			this.map.set(k1, sub)
		}

		sub.addSeveral(k2, vs)
	}

	/** Add key pair and associated value if it's not exist yet. */
	addIf(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1) as ListMap<K2, V>
		if (!sub) {
			sub = new ListMap()
			this.map.set(k1, sub)
		}

		sub.addIf(k2, v)
	}

	/** Add a key pair and several values. */
	addSeveralIf(k1: K1, k2: K2, vs: V[]) {
		if (vs.length === 0) {
			return
		}

		let sub = this.map.get(k1)
		if (!sub) {
			sub = new ListMap()
			this.map.set(k1, sub)
		}

		sub.addSeveralIf(k2, vs)
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
	deleteOf(k1: K1) {
		this.map.delete(k1)
	}
	
	/** Clear all the data. */
	clear() {
		this.map = new Map()
	}
}


/** 
 * `K1 -> K2 -> Set<V>` Map Struct.
 * Index a value set by a pair of keys.
 */
export class PairKeysSetMap<K1, K2, V> implements MethodsObserved<
'firstKeys' | 'secondKeysOf' | 'secondValuesOf' | 'values' | 'entries' | 'flatEntries'
	| 'secondEntriesOf' | 'has' | 'hasFirstKey' | 'firstKeyCount' | 'secondKeyCountOf'
	| 'get' | 'getSecond' | 'clone',
'set' | 'setSecond' | 'add' | 'addSeveral' | 'delete'
	| 'deleteKeys' | 'deleteOf' | 'clear'
> {

	protected map: Map<K1, SetMap<K2, V>> = new Map()

	/** Iterate first keys. */
	firstKeys(): Iterable<K1> {
		return this.map.keys()
	}

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

	/** Iterate each key pairs and associated value list. */
	*entries(): Iterable<[K1, K2, Set<V>]> {
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
	*secondEntriesOf(k1: K1): Iterable<[K2, Set<V>]> {
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

		return sub.hasKey(k2)
	}

	/** Has secondary map associated by first key. */
	hasFirstKey(k1: K1): boolean {
		return this.map.has(k1)
	}

	/** Get the associated value count by key pair. */
	countOf(k1: K1, k2: K2) {
		return this.map.get(k1)?.countOf(k2)
	}

	/** Get the count of all the first keys. */
	firstKeyCount(): number {
		return this.map.size
	}

	/** Get the associated secondary key count by first key. */
	secondKeyCountOf(k1: K1) {
		return this.map.get(k1)?.keyCount()
	}

	/** Get associated value list by key pair. */
	get(k1: K1, k2: K2): Set<V> | undefined {
		let sub = this.map.get(k1)
		if (!sub) {
			return undefined
		}

		return sub.get(k2)
	}

	/** Get the map consist of second keys and values from the first key. */
	getSecond(k1: K1): SetMap<K2, V> | undefined {
		return this.map.get(k1)
	}

	/** Clone to get a new pair keys set map with same data. */
	clone(): PairKeysSetMap<K1, K2, V> {
		let cloned = new PairKeysSetMap<K1, K2, V>()

		for (let [key, map] of this.map.entries()) {
			cloned.map.set(key, map.clone())
		}

		return cloned
	}

	/** Set key pair and associated values. */
	set(k1: K1, k2: K2, v: Set<V>) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new SetMap()
			this.map.set(k1, sub)
		}

		sub.set(k2, v)
	}

	/** Replace with first key and associated map of second keys and values. */
	setSecond(k1: K1, m: SetMap<K2, V>) {
		this.map.set(k1, m)
	}

	/** Add key pair and associated value. */
	add(k1: K1, k2: K2, v: V) {
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new SetMap()
			this.map.set(k1, sub)
		}

		sub.add(k2, v)
	}

	/** Add a key pair and several values. */
	addSeveral(k1: K1, k2: K2, vs: V[]) {
		if (vs.length === 0) {
			return
		}
		
		let sub = this.map.get(k1)
		if (!sub) {
			sub = new SetMap()
			this.map.set(k1, sub)
		}

		sub.addSeveral(k2, vs)
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
	deleteOf(k1: K1) {
		this.map.delete(k1)
	}
	
	/** Clear all the data. */
	clear() {
		this.map = new Map()
	}
}


/**
 * Map Struct that can query from left to right and right to left.
 * `L -> R`
 * `R -> L`
 */
export class TwoWayMap<L, R> implements MethodsObserved<
	'leftKeys' | 'rightKeys' | 'entries' | 'hasLeft' | 'hasRight' | 'leftKeyCount'
		| 'rightKeyCount' | 'getByLeft' | 'getByRight' | 'clone',
	'set' | 'setUnRepeatably' | 'deleteLeft' | 'deleteRight' | 'clear'
> {

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
	getByLeft(l: L): R | undefined {
		return this.lm.get(l)
	}

	/** Get left key by a right key. */
	getByRight(r: R): L | undefined {
		return this.rm.get(r)
	}

	/** Clone to get a new two way map with same data. */
	clone(): TwoWayMap<L, R> {
		let cloned = new TwoWayMap<L, R>()

		cloned.lm = new Map(this.lm)
		cloned.rm = new Map(this.rm)

		return cloned
	}

	/** 
	 * Set a left and right key pair.
	 * Note if left or right key is exist, would cause repetitive maps.
	 */
	set(l: L, r: R) {
		this.lm.set(l, r)
		this.rm.set(r, l)
	}

	/** 
	 * Set a left and right key pair.
	 * Avoid repetitive map items by pre-clear left and right maps.
	 */
	setUnRepeatably(l: L, r: R) {
		this.deleteLeft(l)
		this.deleteRight(r)
		this.set(l, r)
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
 * Map Struct that can query from left to right list and right to left list.
 * `L -> R[]`
 * `R -> L[]`
 */
export class TwoWayListMap<L, R> implements MethodsObserved<
	'leftKeyCount' | 'rightKeyCount' | 'leftKeys' | 'rightKeys' | 'leftValuesOf' | 'rightValuesOf'
		| 'leftEntries' | 'rightEntries' | 'flatEntries' | 'has' | 'hasLeft' | 'hasRight'
		| 'countOfLeft' | 'countOfRight' | 'leftKeyCount' | 'rightKeyCount' | 'getByLeft' | 'getByRight'
		| 'clone',
	'add' | 'addIf' | 'delete' | 'deleteLeft' | 'deleteRight' | 'replaceLeft' | 'replaceRight' | 'clear'
> {

	protected lm: ListMap<L, R> = new ListMap()
	protected rm: ListMap<R, L> = new ListMap()

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

	/** Iterate associated left keys by right key. */
	*leftValuesOf(r: R): Iterable<L> {
		let ls = this.rm.get(r)
		if (ls) {
			yield* ls
		}
	}

	/** Iterate associated right keys by left key. */
	*rightValuesOf(l: L): Iterable<R> {
		let rs = this.lm.get(l)
		if (rs) {
			yield* rs
		} 
	}

	/** Iterate left and it's associated right value list. */
	leftEntries(): Iterable<[L, R[]]> {
		return this.lm.entries()
	}

	/** Iterate right and it's associated left value list. */
	rightEntries(): Iterable<[R, L[]]> {
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
		return this.lm.hasKey(l)
	}

	/** Has a right key. */
	hasRight(r: R): boolean {
		return this.rm.hasKey(r)
	}

	/** Get count of associated right keys by a left key. */
	countOfLeft(l: L): number {
		return this.lm.countOf(l)
	}

	/** Get count of associated left keys by a right key. */
	countOfRight(r: R): number {
		return this.rm.countOf(r)
	}

	/** Get associated right keys by a left key. */
	getByLeft(l: L): R[] | undefined {
		return this.lm.get(l)
	}

	/** Get associated left keys by a right key. */
	getByRight(r: R): L[] | undefined {
		return this.rm.get(r)
	}

	/** Clone to get a new two way list map with same data. */
	clone(): TwoWayListMap<L, R> {
		let cloned = new TwoWayListMap<L, R>()

		cloned.lm = this.lm.clone()
		cloned.rm = this.rm.clone()

		return cloned
	}

	/** 
	 * Add a left and right value as a pair.
	 * Note it will not validate whether value exist, and will add it repeatedly if it exists.
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
	replaceLeft(l: L, rs: R[]) {
		let oldRs = this.lm.get(l)

		if (oldRs) {
			for (let r of rs) {
				if (!oldRs.includes(r)) {
					this.rm.add(r, l)
				}
			}

			for (let r of oldRs) {
				if (!rs.includes(r)) {
					this.rm.delete(r, l)
				}
			}
		}
		else {
			for (let r of rs) {
				this.rm.add(r, l)
			}
		}

		if (rs.length === 0) {
			if (oldRs) {
				this.lm.deleteOf(l)
			}
		}
		else {
			this.lm.set(l, rs)
		}
	}

	/** Replace right and all it's associated left keys. */
	replaceRight(r: R, ls: L[]) {
		let oldLs = this.rm.get(r)

		if (oldLs) {
			for (let l of ls) {
				if (!oldLs.includes(l)) {
					this.lm.add(l, r)
				}
			}

			for (let l of oldLs) {
				if (!ls.includes(l)) {
					this.lm.delete(l, r)
				}
			}
		}
		else {
			for (let l of ls) {
				this.lm.add(l, r)
			}
		}

		if (ls.length === 0) {
			if (oldLs) {
				this.rm.deleteOf(r)
			}
		}
		else {
			this.rm.set(r, ls)
		}
	}

	/** Clear all the data. */
	clear() {
		this.lm.clear()
		this.rm.clear()
	}
}


/**
 * Map Struct that can query from left to right set and right to left set.
 * `L -> Set<R>`
 * `R -> Set<L>`
 */
export class TwoWaySetMap<L, R> implements MethodsObserved<
	'leftKeyCount' | 'rightKeyCount' | 'leftKeys' | 'rightKeys' | 'leftValuesOf' | 'rightValuesOf'
		| 'leftEntries' | 'rightEntries' | 'flatEntries' | 'has' | 'hasLeft' | 'hasRight'
		| 'countOfLeft' | 'countOfRight' | 'leftKeyCount' | 'rightKeyCount' | 'getByLeft' | 'getByRight'
		| 'clone',
	'add' | 'delete' | 'deleteLeft' | 'deleteRight' | 'replaceLeft' | 'replaceRight' | 'clear'
>  {

	protected lm: SetMap<L, R> = new SetMap()
	protected rm: SetMap<R, L> = new SetMap()

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
			yield* rs
		} 
	}

	/** Iterate associated left keys by right key. */
	*leftValuesOf(r: R): Iterable<L> {
		let ls = this.rm.get(r)
		if (ls) {
			yield* ls
		} 
	}

	/** Iterate left and it's associated right value list. */
	leftEntries(): Iterable<[L, Set<R>]> {
		return this.lm.entries()
	}

	/** Iterate right and it's associated left value list. */
	rightEntries(): Iterable<[R, Set<L>]> {
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
		return this.lm.hasKey(l)
	}

	/** Has a right key. */
	hasRight(r: R): boolean {
		return this.rm.hasKey(r)
	}

	/** Get count of associated right keys by a left key. */
	countOfLeft(l: L): number {
		return this.lm.countOf(l)
	}

	/** Get count of associated left keys by a right key. */
	countOfRight(r: R): number {
		return this.rm.countOf(r)
	}

	/** Get associated right keys by a left key. */
	getByLeft(l: L): Set<R> | undefined {
		return this.lm.get(l)
	}

	/** Get associated left keys by a right key. */
	getByRight(r: R): Set<L> | undefined {
		return this.rm.get(r)
	}

	/** Clone to get a new two way set map with same data. */
	clone(): TwoWaySetMap<L, R> {
		let cloned = new TwoWaySetMap<L, R>()

		cloned.lm = this.lm.clone()
		cloned.rm = this.rm.clone()

		return cloned
	}

	/** 
	 * Add a left and right value as a pair.
	 * Note it will not validate whether value exist, and will add it repeatedly if it exists.
	 */
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
	replaceLeft(l: L, rs: Set<R>) {
		let oldRs = this.lm.get(l)

		if (oldRs) {
			for (let r of rs) {
				if (!oldRs.has(r)) {
					this.rm.add(r, l)
				}
			}

			for (let r of oldRs) {
				if (!rs.has(r)) {
					this.rm.delete(r, l)
				}
			}
		}
		else {
			for (let r of rs) {
				this.rm.add(r, l)
			}
		}

		if (rs.size === 0) {
			if (oldRs) {
				this.lm.deleteOf(l)
			}
		}
		else {
			this.lm.set(l, rs)
		}
	}

	/** Replace right and all it's associated left keys. */
	replaceRight(r: R, ls: Set<L>) {
		let oldLs = this.rm.get(r)

		if (oldLs) {
			for (let l of ls) {
				if (!oldLs.has(l)) {
					this.lm.add(l, r)
				}
			}

			for (let l of oldLs) {
				if (!ls.has(l)) {
					this.lm.delete(l, r)
				}
			}
		}
		else {
			for (let l of ls) {
				this.lm.add(l, r)
			}
		}

		if (ls.size === 0) {
			if (oldLs) {
				this.rm.deleteOf(r)
			}
		}
		else {
			this.rm.set(r, ls)
		}
	}

	/** Clear all the data. */
	clear() {
		this.lm.clear()
		this.rm.clear()
	}
}