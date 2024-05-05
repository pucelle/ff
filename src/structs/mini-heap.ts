// Mini-Heap Algorithm, reference from: <<Algorithms design and analysis>> - M.H.Alsuwaiyel, Chapter 4.


/** Every inserted value will be ordered to ensure the minimum value in the head. */
export class MiniHeap<T> {
	
	/** If `a < b`, returns `-1`. */
	private comparer: (a: T, b: T) => number

	/** List of items. */
	private list: T[] = []

	constructor(comparer: (a: T, b: T) => number) {
		this.comparer = comparer
	}

	/** Whether have no items. */
	isEmpty(): boolean {
		return this.list.length === 0
	}

	/** Add an item. */
	add(value: T) {

		// Put in the end then swap up.
		this.list.push(value)
		this.shiftUp(this.list.length - 1)
	}

	/** Get an item. */
	getItems(): T[] {
		return this.list
	}

	/** Get the minimum item in the head. */
	getHead(): T | undefined {
		if (this.list.length === 0) {
			return undefined
		}
		
		return this.list[0]
	}

	/** Remove the item in the head and return it. */
	popHead(): T | undefined {
		if (this.list.length === 0) {
			return undefined
		}

		if (this.list.length === 1) {
			return this.list.pop()
		}

		// Put in the head then swap down.
		let firstValue = this.list[0]
		this.list[0] = this.list.pop()!
		this.shiftDown(0)

		return firstValue
	}
	
	/** 
	 * Swap item with it's parent if needed,
	 * and do it recursively.
	 */
	private shiftUp(index: number) {
		if (index === 0) {
			return
		}

		let parentIndex = ((index + 1) >> 1) - 1

		// Smaller than parent, swap.
		if (this.comparer(this.list[index], this.list[parentIndex]) < 0) {
			this.swap(index, parentIndex)
			this.shiftUp(parentIndex)
		}
	}

	/** 
	 * Swap item with one of it's children if needed,
	 * and do it recursively.
	 */
	private shiftDown(index: number) {
		let rightIndex = (index + 1) << 1
		let leftIndex = rightIndex - 1
		let childIndex = leftIndex

		if (leftIndex >= this.list.length) {
			return
		}

		// Left value larger than right, pick right.
		if (rightIndex < this.list.length && this.comparer(this.list[leftIndex], this.list[rightIndex]) > 0) {
			childIndex = rightIndex
		}

		// Child value is smaller than current, swap.
		if (this.comparer(this.list[childIndex], this.list[index]) < 0) {
			this.swap(childIndex, index)
			this.shiftDown(childIndex)
		}
	}

	/** Swap items in indices. */
	private swap(i: number, j: number) {
		let vi = this.list[i]
		this.list[i] = this.list[j]
		this.list[j] = vi
	}

	/** Clear all items */
	clear() {
		this.list = []
	}
}