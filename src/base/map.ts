/** Map that indexed by a pair of keys. */
export class DoubleKeysMap<K1 extends object, K2, V> {

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
