import {TwoWayMap} from './map'


// We want to reduce times of moving elements, the best way is:
// http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf

// But we don't want it complex, and just need a way to handle single place inserting or multiple places removing.
// So just provide a very simple O(N) method here.

// Another solution is here: https://github.com/Polymer/lit-html/blob/master/src/directives/repeat.ts


/** A edit record to indicate how to process current item. */
export interface EditRecord {

	/** Current Edit type. */
	type: EditType

	/** 
	 * Index of the old item if decided to use or delete it.
	 * Be `-1` when inserting.
	 */
	fromIndex: number

	/** 
	 * Index of the new item in new item list.
	 * Be `-1` when deleting.
	 */
	toIndex: number

	/** 
	 * Index in the old item list that need to insert item before.
	 * Be `-1` when no need to do inserting.
	 * Otherwise betweens `0 ~ items.length`.
	 */
	insertIndex: number
}


export enum EditType {

	/** 
	 * Ignores, will be used later as a matched item to move or as a reuseable item to reuse.
	 * Uses in internal, no need to handle it in your codes.
	 */
	InternalSkip,

	/** 
	 * Leaves it because of old item matches new item.
	 * - `fromIndex`: the match item index in old item list.
	 * - `toIndex`: the match item index in new item list.
	 * - `insertIndex`: be `-1`.
	 */
	Leave,

	/** 
	 * Moves same item from it's old index to current index.
	 * - `fromIndex`: the match item index in old item list indicates where to move from.
	 * - `toIndex`: the match item index in new item list indicates where to move to.
	 * - `insertIndex`: index in old item list indicates where you should insert new item before.
	 */
	Move,

	/** 
	 * Modify item and no need to move it.
	 * - `fromIndex`: the match item index in old item list.
	 * - `toIndex`: the match item index in new item list.
	 * - `insertIndex`: be `-1`.
	 */
	Modify,

	/** 
	 * Moves same item from it's old index to current index, and do modification.
	 * - `fromIndex`: the match item index in old item list indicates where to move from.
	 * - `toIndex`: the match item index in new item list indicates where to move to.
	 * - `insertIndex`: index in old item list indicates where you should insert new item before.
	 */
	MoveModify,

	/** 
	 * Insert a new item.
	 * - `fromIndex`: be `-1`.
	 * - `toIndex`: the match item index in new item list indicates which item to insert.
	 * - `insertIndex`: index in old item list indicates where you should insert new item before.
	 */
	Insert,

	/** 
	 * Delete old item.
	 * - `fromIndex`: the match item index in old item list indicates which item to delete.
	 * - `toIndex`: be `-1`.
	 * - `insertIndex`: be `-1`.
	 */
	Delete,
}


/** Get a edit record from an old indices graph to a new one. */
export function getEditRecord<T>(oldItems: T[], newItems: T[], willReuse: boolean): EditRecord[] {
	if (newItems.length === 0) {
		return oldItems.map(function(_item, index) {
			return {
				type: EditType.Delete,
				fromIndex: index,
				toIndex: -1,
				insertIndex: -1,
			}
		})
	}
	else if (oldItems.length === 0) {
		return newItems.map(function(_item, index) {
			return {
				type: EditType.Insert,
				fromIndex: -1,
				toIndex: index,
				insertIndex: 0,
			}
		})
	}
	else {
		return getNormalEditRecord(oldItems, newItems, willReuse)
	}
}


/** 
 * When `oldItems` and `newItems` are both not empty.
 * When `willReuse` is `false`, will never reuse items.
 */
function getNormalEditRecord<T>(oldItems: T[], newItems: T[], willReuse: boolean): EditRecord[] {

	// `indexMap`: two way index map: sorted old index <=> new index.
	// `restOldIndices`: sorted old indices which not appear in `indexMap`.
	let {indexMap, restOldIndices} = makeTwoWayIndexMap(oldItems, newItems)

	// All the new indices that have an old index mapped to, and order by the orders in the `oldItems`.
	let newIndicesHaveOldMapped: number[] = []

	for (let oldIndex of indexMap.leftKeys()) {
		let indexInNew = indexMap.getByLeft(oldIndex)!
		newIndicesHaveOldMapped.push(indexInNew)
	}

	// Get a long enough incremental sequence from new indices,
	// from new indices that have an old index mapped to,
	// so no need move this part.
	let stableNewIndicesStack = new ReadonlyIndexStack(findLongestIncrementalSequence(newIndicesHaveOldMapped))

	// Old item indices that will be reused.
	let restOldIndicesStack = new ReadonlyIndexStack(restOldIndices)

	// New index of the next fully match item pair. `0 ~ newItems.length`
	let nextStableNewIndex = stableNewIndicesStack.getNext()

	// Index of old items to indicate where to insert new item.
	let insertIndex = nextStableNewIndex === -1 ? oldItems.length : indexMap.getByRight(nextStableNewIndex)!
	let insertIndexInserted = false

	// Output this edit records.
	let edit: EditRecord[] = []

	// For each new item.
	for(let toIndex = 0; toIndex < newItems.length; toIndex++) {

		// Old and new items match each other, leave them both.
		if (toIndex === nextStableNewIndex) {
			let fromIndex = indexMap.getByRight(nextStableNewIndex)!

			edit.push({
				type: EditType.Leave,
				fromIndex,
				toIndex,
				insertIndex: -1,
			})

			nextStableNewIndex = stableNewIndicesStack.getNext()
			insertIndex = nextStableNewIndex === -1 ? oldItems.length : indexMap.getByRight(nextStableNewIndex)!
			insertIndexInserted = false
		}

		// Move matched old item to the new position, no need to modify.
		else if (indexMap.hasRight(toIndex)) {
			let fromIndex = indexMap.getByRight(toIndex)!

			edit.push({
				type: EditType.Move,
				fromIndex,
				toIndex,
				insertIndex,
			})

			insertIndexInserted = true
		}
		
		// Reuse old item, moves them to the new position, then modify.
		else if (willReuse && !restOldIndicesStack.isEnded()) {
			let fromIndex = restOldIndicesStack.getNext()

			if (fromIndex === insertIndex - 1 && !insertIndexInserted) {
				edit.push({
					type: EditType.Modify,
					fromIndex,
					toIndex,
					insertIndex: -1,
				})
			}
			else {
				edit.push({
					type: EditType.MoveModify,
					fromIndex,
					toIndex,
					insertIndex,
				})

				insertIndexInserted = true
			}
		}

		// No old items can be reused, creates new item.
		else {
			edit.push({
				type: EditType.Insert,
				fromIndex: -1,
				toIndex,
				insertIndex,
			})

			insertIndexInserted = true
		}
	}

	// Remove not used items.
	while (!restOldIndicesStack.isEnded()) {
		let oldIndex = restOldIndicesStack.getNext()

		edit.push({
			type: EditType.Delete,
			fromIndex: oldIndex,
			toIndex: -1,
			insertIndex: -1,
		})
	}

	return edit
}


/** Create a 2 way index map: old index <=> new index, just like a sql inner join. */
function makeTwoWayIndexMap<T>(oldItems: T[], newItems: T[]) {

	// Will find last match when repeated items exist.
	let newItemIndexMap: Map<T, number> = new Map(newItems.map((item, index) => [item, index]))

	// old index <=> new index.
	let indexMap: TwoWayMap<number, number> = new TwoWayMap()
	let restOldIndices: number[] = []

	for (let i = 0; i < oldItems.length; i++) {
		let oldItem = oldItems[i]

		if (newItemIndexMap.has(oldItem)) {
			indexMap.set(i, newItemIndexMap.get(oldItem)!)

			// Must delete, or will cause error when same item exist.
			newItemIndexMap.delete(oldItem)
		}
		else {
			restOldIndices.push(i)
		}
	}

	return {indexMap, restOldIndices}
}


/** 
 * A simple stack can get next one from start position.
 * Can avoid shift or pop operation from an array.
 */
class ReadonlyIndexStack {

	private items: number[]
	private offset: number = 0

	constructor(items: number[]) {
		this.items = items
	}

	addItems(items: number[]) {
		this.items.push(...items)
	}

	isEnded(): boolean {
		return this.offset >= this.items.length
	}

	getNext(): number {
		return this.isEnded()
			? -1
			: this.items[this.offset++]
	}

	peekNext(): number{
		return this.isEnded()
			? -1
			: this.items[this.offset]
	}
}


/** 237456 -> 23456 */
function findLongestIncrementalSequence(items: number[]) {
	
	// In the first loop, we try to find each incremental and continuous sequence.
	// 237456 -> [23, 7, 456]

	let startIndex = 0
	let increasedSequenceIndices: [number, number][] = []

	for (let i = 1; i < items.length; i++) {
		if (items[i] < items[i - 1]) {
			increasedSequenceIndices.push([startIndex, i])
			startIndex = i
		}
	}

	if (startIndex < items.length) {
		increasedSequenceIndices.push([startIndex, items.length])
	}

	// In the second loop, we try to find the longest discrete incremental sequence.
	// This is not the best, but it can at least pick the longest discrete incremental part,
	// and simple enough.

	// [23, 7, 456]
	// 23 -> 7 skip -> 456 pick

	// [2, 78, 456]
	// 2 -> 78 pick -> 456 pick, not best result

	let longest: number[] = []
	let currentValue = -1

	for (let i = 0; i < increasedSequenceIndices.length; i++) {
		let [start, end] = increasedSequenceIndices[i]

		if (items[start] > currentValue) {
			longest.push(...items.slice(start, end))
			currentValue = longest[longest.length - 1]
		}
		else if (end - start > longest.length) {
			longest = items.slice(start, end)
			currentValue = longest[longest.length - 1]
		}
	}

	return longest
}