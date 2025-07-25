import {MethodsToObserve} from '@pucelle/lupos'


/** Manage selections. */
export class Selections<T = any> implements MethodsToObserve<
	'hasSelected' | 'hasAnySelected' | 'getSelectedCount' | 'getSelected' | 'getLatestSelected'	| 'getLatestTouched',
	'select' | 'selectOnly' | 'selectByMouseEvent' | 'limitSelectionAt' | 'deselect' | 'toggleSelect' | 'clear'
> {

	private selected: Set<T> = new Set()
	private latestTouched: T | null = null

	/** Whether has selected item. */
	hasSelected(item: T): item is T {
		return this.selected.has(item as T)
	}

	/** Whether selected any item. */
	hasAnySelected(): boolean {
		return this.selected.size > 0
	}

	/** Get selected count. */
	getSelectedCount(): number {
		return this.selected.size
	}

	/** Get selected item list. */
	getSelected(): Iterable<T> {
		return this.selected
	}

	/** Get latest selected item. */
	getLatestSelected(): T | null {
		let item: T | null = null
		
		for (let n of this.selected) {
			item = n
		}

		return item
	}	

	/** Get latest selected or deselected item. */
	getLatestTouched(): T | null {
		return this.latestTouched
	}

	/** Select items. */
	select(...items: T[]) {
		for (let item of items) {
			this.selected.add(item)
		}

		if (items.length > 0) {
			this.latestTouched = items[items.length - 1]
		}
	}

	/** Select only these items. */
	selectOnly(...items: T[]) {
		this.selected = new Set(items)
		
		if (items.length > 0) {
			this.latestTouched = items[items.length - 1]
		}
	}

	/** Shift or Ctrl select, or normal select. */
	selectByMouseEvent(index: number, allData: T[], e: MouseEvent) {
		let currentItem = allData[index]

		if (e.shiftKey) {
			let previousTouched = this.getLatestTouched()
			let previousIndex = previousTouched ? allData.indexOf(previousTouched) : -1

			if (previousIndex === -1) {
				previousIndex = 0
			}

			let start = Math.min(previousIndex, index)
			let end = Math.max(previousIndex, index) + 1
			let itemsInRange = allData.slice(start, end)

			// Ensure item to be latest touched.
			itemsInRange.push(currentItem)

			if (this.hasSelected(currentItem)) {
				this.deselect(...itemsInRange)
			}
			else {
				this.select(...itemsInRange)
			}
		}
		else if (e.ctrlKey) {
			this.toggleSelect(currentItem)
		}
		else {
			this.selectOnly(currentItem)
		}
	}

	/** Limit can select only within these data items. */
	limitSelectionAt(items: Iterable<T>) {
		if (this.selected.size === 0) {
			return
		}

		let set = new Set(items)
		let toRemove: T[] = []

		for (let item of this.selected) {
			if (!set.has(item)) {
				toRemove.push(item)
			}
		}

		for (let item of toRemove) {
			this.selected.delete(item)
		}
	}

	/** Deselect these items. */
	deselect(...items: T[]) {
		for (let item of items) {
			this.selected.delete(item)
		}

		if (items.length > 0) {
			this.latestTouched = items[items.length - 1]
		}
	}

	/** Toggle selecting a item, returns whether selected at last. */
	toggleSelect(item: T): boolean {
		if (this.selected.has(item)) {
			this.deselect(item)
			return false
		}
		else {
			this.select(item)
			return true
		}
	}

	/** Clear all selections. */
	clear() {
		if (this.selected.size > 0) {
			this.selected.clear()
		}
	}
}
