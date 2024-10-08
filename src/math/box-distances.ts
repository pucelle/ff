import type {Direction} from './direction'


/** All 4 box edge distance keys. */
const BoxDistanceKeys: BoxDistanceKey[] = ['top', 'right', 'bottom', 'left']


/** Represents a box edge distances object, which including top, right, bottom, left values. */
export class BoxDistances {

	/** Constant zero box edge distance object. */
	static Zero: BoxDistances = Object.freeze(new BoxDistances())

	/** Parse from a string to get an edge distance object. */
	static fromString(string: string) {
		return new BoxDistances(...string.split(/\s+/).map(s => Number(s)))
	}


	top: number
	right: number
	bottom: number
	left: number

	constructor(top: number = 0, right: number = top, bottom: number = top, left: number = right) {
		this.top = top
		this.right = right
		this.bottom = bottom
		this.left = left
	}

	/** Get sum of left and right values. */
	get horizontal(): number {
		return this.left + this.right
	}

	/** Get sum of top and bottom values. */
	get vertical(): number {
		return this.top + this.bottom
	}

	/** Reset all values to 0. */
	reset() {
		this.top = 0
		this.right = 0
		this.bottom = 0
		this.left = 0
	}

	/** Reset values. */
	set(top: number = 0, right: number = top, bottom: number = top, left: number = right) {
		this.top = top
		this.right = right
		this.bottom = bottom
		this.left = left
	}

	/** Copy values from another box edge distance object. */
	copyFrom(o: BoxDistances) {
		this.top = o.top
		this.right = o.right
		this.bottom = o.bottom
		this.left = o.left
	}

	/** Clone current object. */
	clone() {
		return new BoxDistances(
			this.top,
			this.right,
			this.bottom,
			this.left,
		)
	}

	/** Get the maximum absolute value of all 4 values. */
	getMaximumAbsoluteValue(): number {
		return Math.max(
			Math.abs(this.top),
			Math.abs(this.right),
			Math.abs(this.bottom),
			Math.abs(this.left)
		)
	}

	/** 
	 * Collapse with several box edge distance objects into current,
	 * pick maximum value in all the directions.
	 */
	collapse(...os: BoxDistances[]): this {
		for (let o of os) {
			for (let key of BoxDistanceKeys) {
				this[key] = Math.max(this[key], o[key])
			}
		}

		return this
	}

	/** 
	 * Collapse with a box edge distance object,
	 * pick maximum value at specified direction.
	 */
	collapseAt(o: BoxDistances, direction: Direction) {
		let keys = direction.toBoxEdgeKeys()

		for (let key of keys) {
			this[key] = Math.max(this[key], o[key])
		}
	}

	/** Collapse box edge distance value by box edge distance key. */
	collapseValueBy(key: BoxDistanceKey, value: number) {
		this[key] = Math.max(this[key], value)
	}

	/** Collapse box edge distance value at direction. */
	collapseValueAt(direction: Direction, value: number) {
		let keys = direction.toBoxEdgeKeys()

		for (let key of keys) {
			this[key] = Math.max(this[key], value)
		}
	}

	/** Pick values by specified box edge distance keys, values at other directions will become `0`. */
	pickBy(keys: BoxDistanceKey[]): BoxDistances {
		let {top, right, bottom, left} = this

		top = keys.includes('top') ? top : 0
		right = keys.includes('right') ? right : 0
		bottom = keys.includes('bottom') ? bottom : 0
		left = keys.includes('left') ? left : 0

		return new BoxDistances(
			top,
			right,
			bottom,
			left,
		)
	}

	/** Pick values at specified direction, values at other directions will become `0`. */
	pickAt(direction: Direction): BoxDistances {
		let keys = direction.toBoxEdgeKeys()
		return this.pickBy(keys)
	}

	/** Multiply scalar value, returns a new object. */
	multiplyScalar(factor: number): BoxDistances {
		return this.clone().multiplyScalarSelf(factor)
	}

	/** Multiply scalar value to self. */
	multiplyScalarSelf(factor: number): this {
		this.top *= factor
		this.right *= factor
		this.bottom *= factor
		this.left *= factor

		return this
	}


	/** Round all values, returns a new object. */
	round(): BoxDistances {
		return this.clone().roundSelf()
	}

	/** Round all values. */
	roundSelf(): this {
		this.top = Math.round(this.top)
		this.right = Math.round(this.right)
		this.bottom = Math.round(this.bottom)
		this.left = Math.round(this.left)

		return this
	}

	/** Do Math Ceil for all values, returns a new object. */
	ceil(): BoxDistances {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil for all values. */
	ceilSelf(): this {
		this.top = Math.ceil(this.top)
		this.right = Math.ceil(this.right)
		this.bottom = Math.ceil(this.bottom)
		this.left = Math.ceil(this.left)

		return this
	}

	/** Do Math Floor for all values, returns a new object. */
	floor(): BoxDistances {
		return this.clone().floorSelf()
	}

	/** Do Math Floor for all values. */
	floorSelf(): this {
		this.top = Math.floor(this.top)
		this.right = Math.floor(this.right)
		this.bottom = Math.floor(this.bottom)
		this.left = Math.floor(this.left)

		return this
	}
	
	/** Convert to JSON data. */
	toJSON(): Record<BoxDistanceKey, number> {
		return {
			top: this.top,
			right: this.right,
			bottom: this.bottom,
			left: this.left,
		}
	}

	/** Convert to array of margin values. */
	toArray(): [number, number, number, number] {
		return [
			this.top,
			this.right,
			this.bottom,
			this.left,
		]
	}
}
