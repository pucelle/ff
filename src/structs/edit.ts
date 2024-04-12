import {TwoWayMap} from './map'


// We want to reduce times of moving elements, the best way is:
// http://citeseerx.ist.psu.edu/viewdoc/download?doi=10.1.1.4.6927&rep=rep1&type=pdf

// But we don't want it complex, and just need a way to handle single place inserting or mutiple places removing.
// So just provide a very simple O(N) method here.

// Another solution is here: https://github.com/Polymer/lit-html/blob/master/src/directives/repeat.ts


/** A edit record to indicate how to process current item. */
export interface EditRecord {

	/** Current Edit type. */
	type: EditType

	/** 
	 * Index in the old item list that currently handling.
	 * Be position of the next old item if decide to insert a new item before it,
	 * or move another item before it.
	 * Betweens `0 ~ items.length`.
	 */
	nextOldIndex: number

	/** 
	 * Index of the old item if decided to reuse or delete it.
	 * Be `-1` when doing inserting.
	 */
	fromIndex: number

	/** 
	 * Index of the new item in new item list.
	 * Be `-1` if will delete the item.
	 */
	toIndex: number
}


export enum EditType {

	/** 
	 * Ignores, will be used later as a matched item to move or as a reuseable item to reuse.
	 * Uses in internal, no need to handle it in your codes.
	 */
	Skip,

	/** Leaves it because of old item matches new item. */
	Leave,

	/** Moves same item from it's old index to current index. */
	Move,

	/** Modify item and not move it. */
	Modify,

	/** Move item and modify item. */
	MoveModify,

	/** Insert a new item. */
	Insert,

	/** Delete old item. */
	Delete,
}


/** Get a edit record from an old indices graph to a new one. */
export function getEditRecord<T>(oldItems: T[], newItems: T[], willReuse: boolean): EditRecord[] {
	if (newItems.length === 0) {
		return oldItems.map(function(_item, index) {
			return {
				type: EditType.Delete,
				nextOldIndex: index,
				fromIndex: index,
				toIndex: -1,
			}
		})
	}
	else if (oldItems.length === 0) {
		return newItems.map(function(_item, index) {
			return {
				type: EditType.Insert,
				nextOldIndex: 0,
				fromIndex: -1,
				toIndex: index,
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

	// two way index map: old index <=> new index.
	let {indexMap, restOldIndices} = makeTwoWayIndexMap(oldItems, newItems)

	// All the new indices that have an old index mapped to, and order by the orders in the `oldItems`.
	let newIndicesHaveOldMapped: number[] = []

	for (let oldIndex of indexMap.leftKeys()) {
		let indexInNew = indexMap.getByLeft(oldIndex)!
		newIndicesHaveOldMapped.push(indexInNew)
	}

	// Get a long enough incremental new indices sequence,
	// from new indices that have an old index mapped to,
	// so no need move this part.
	let stableNewIndexStack = new ReadonlyStack(findLongestIncreasedSequence(newIndicesHaveOldMapped))

	// Old item indices that will be reused.
	let restOldIndicesStack = new ReadonlyStack(restOldIndices)

	// Another optimization:
	// After get stable items, some reuseable items between two stable items can be reused without moving.
	// This is good when data is absolutely random, but not help much for normal data.

	let edit: EditRecord[] = []
	let oldIndex = 0
	let newIndex = 0
	let nextStableNewIndex = stableNewIndexStack.getNext()
	let nextStableOldIndex = indexMap.getByRight(nextStableNewIndex) ?? -1
	let lastStableOldIndex = -1

	while (oldIndex < oldItems.length || newIndex < newItems.length) {
		let type: EditType
		let handingOldIndex = oldIndex
		let fromIndex = -1
		let toIndex = newIndex

		// New item list ended, delete rest old items.
		if (newIndex === newItems.length) {
			type = EditType.Skip
			oldIndex++
		}
		
		// If should reuse, and already an old item exist and before next stable position,
		// and also after last stable position,
		// leave old item at current position, then modify.
		else if (willReuse && newIndex !== nextStableNewIndex && !restOldIndicesStack.isEnded()
			&& restOldIndicesStack.peekNext() > lastStableOldIndex
			&& (restOldIndicesStack.peekNext() < nextStableOldIndex || nextStableOldIndex === -1))
		{
			type = EditType.Modify
			fromIndex = restOldIndicesStack.getNext()
			oldIndex++
			newIndex++
		}

		// Old item doesn't match, leaves old item for reusing or deleting it later.
		else if (oldIndex !== nextStableOldIndex && oldIndex < oldItems.length) {
			type = EditType.Skip
			oldIndex++
		}

		// Old and new items matches each other, skip them all.
		else if (newIndex === nextStableNewIndex) {
			type = EditType.Leave
			fromIndex = oldIndex
			oldIndex++
			newIndex++
			nextStableNewIndex = stableNewIndexStack.isEnded() ? -1 : stableNewIndexStack.getNext()
			lastStableOldIndex = nextStableOldIndex
			nextStableOldIndex = nextStableNewIndex === -1 ? -1 : indexMap.getByRight(nextStableNewIndex)!
		}

		// Moves matched old item to the new position, no need to modify.
		else if (indexMap.hasRight(newIndex)) {
			type = EditType.Move
			fromIndex = indexMap.getByRight(newIndex)!
			newIndex++
		}
		
		// Reuses old item, moves them to the new position, then modify.
		else if (willReuse && !restOldIndicesStack.isEnded()) {
			type = EditType.MoveModify
			fromIndex = restOldIndicesStack.getNext()
			newIndex++
		}

		// No old items can be reused, creates new item.
		else {
			type = EditType.Insert
			newIndex++
		}

		// No need to record `Skip`.
		if (type !== EditType.Skip) {
			edit.push({
				type,
				nextOldIndex: handingOldIndex,
				fromIndex,
				toIndex,
			})
		}
	}

	// Removes not used items.
	while (!restOldIndicesStack.isEnded()) {
		let handingOldIndex = restOldIndicesStack.getNext()

		edit.push({
			type: EditType.Delete,
			nextOldIndex: handingOldIndex,
			fromIndex: handingOldIndex,
			toIndex: -1,
		})
	}

	return edit
}


/** Create a 2 way index map: old index <=> new index, just like a sql inner join. */
function makeTwoWayIndexMap<T>(oldItems: T[], newItems: T[]) {
	// Have a little problem, will find last match when repeated items exist.
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
 * A simple stack can get next one from start.
 * Can avoid shift or pop operation from an array.
 */
class ReadonlyStack<T> {

	private items: T[]
	private offset: number = 0

	constructor(items: T[]) {
		this.items = items
	}

	isEnded() {
		return this.offset >= this.items.length
	}

	getNext() {
		return this.items[this.offset++] ?? -1
	}

	peekNext() {
		return this.items[this.offset] ?? -1
	}
}


/** 237456 -> 23456 */
function findLongestIncreasedSequence(items: number[]) {
	
	// In the first loop, we try to find each increased sequence.
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

	// In the second loop, we try to find the longest discreate increased sequence.

	// [23, 7, 456]
	// 23 -> 7 excluded -> 456

	// [2, 78, 456]
	// 2 -> 78 replaced -> 456 replaced

	let longest: number[] = []
	let currentValue = -1

	for (let i = 0; i < increasedSequenceIndices.length; i++) {
		let [start, end] = increasedSequenceIndices[i]

		if (items[start] > currentValue) {
			longest = [...longest, ...items.slice(start, end)]
			currentValue = longest[longest.length - 1]
		}
		else if (end - start > longest.length) {
			longest = items.slice(start, end)
			currentValue = longest[longest.length - 1]
		}
	}

	return longest
}