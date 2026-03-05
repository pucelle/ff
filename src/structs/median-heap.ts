import {MiniHeap} from 'lupos'


/** To quickly get median value. */
export class MedianHeap<T> {

	private readonly comparer: (a: T, b: T) => number
	
	/** 
	 * From upper to lower.
	 * size always larger by 1 or equals right size.
	 */
	private readonly left: MiniHeap<T>

	/** From lower to upper. */
	private readonly right: MiniHeap<T>

	/** `comparer` to sort items from lower to upper. */
	constructor(comparer: (a: T, b: T) => number, list: T[] = []) {
		this.comparer = comparer
		this.left = new MiniHeap((a, b) => -comparer(a, b))
		this.right = new MiniHeap(comparer)
		
		for (let item of list) {
			this.add(item)
		}
	}

	/** Get heap size. */
	get size() {
		return this.left.size + this.right.size
	}

	/** 
	 * Get median value.
	 * If have even count of values, will pick the value at lower index.
	 */
	get median(): T | undefined {
		return this.left.getHead()
	}

	/** Build a list to contain all items in the heap. */
	get list() {
		return [...this.left.list.toReversed(), ...this.right.list]
	}

	/** Whether have no items. */
	isEmpty(): boolean {
		return this.left.size === 0
	}

	/** Add an item. */
	add(value: T) {
		if (this.isEmpty()) {
			this.left.add(value)
			return
		}
		
		let compareResult = this.comparer(value, this.median!)

		// Should put left.
		if (compareResult < 0) {
			if (this.left.size > this.right.size) {
				let toMove = this.left.popHead()!
				this.right.add(toMove)
			}

			this.left.add(value)
		}

		// Put left or right both ok.
		else if (compareResult === 0) {
			if (this.left.size > this.right.size) {
				this.right.add(value)
			}
			else {
				this.left.add(value)
			}
		}

		// Put right.
		else {
			if (this.left.size === this.right.size) {
				let toMove = this.right.popHead()!
				this.left.add(toMove)
			}

			this.right.add(value)
		}
	}

	/** Pop items in the start and end tails. */
	popTails() {
		this.left.popTail()
		this.right.popTail()
	}

	/** Clear all items */
	clear() {
		this.left.clear()
		this.right.clear()
	}

	clone() {
		return new MedianHeap(this.comparer, [...this.list])
	}
}