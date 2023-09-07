import {Direction} from './direction'


/** All 4 directional keys. */
export const Direction4Keys: DirectionalKey[] = ['top', 'right', 'bottom', 'left']


/** Represent a margin or padding object, which including top, right, bottom, left values. */
export class DirectionalObject {

	/** Zero directional object. */
	static Zero: DirectionalObject = Object.freeze(new DirectionalObject())

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

	/** Reset all value to 0. */
	reset() {
		this.top = 0
		this.right = 0
		this.bottom = 0
		this.left = 0
	}

	/** Get the maximum absolute value of all 4 values. */
	getMaximumAbsuluteValue(): number {
		return Math.max(
			Math.abs(this.top),
			Math.abs(this.right),
			Math.abs(this.bottom),
			Math.abs(this.left)
		)
	}

	/** Copy from values. */
	from(top: number = 0, right: number = top, bottom: number = top, left: number = right) {
		this.top = top
		this.right = right
		this.bottom = bottom
		this.left = left
	}

	/** Clone current object. */
	clone() {
		return new DirectionalObject(
			this.top,
			this.right,
			this.bottom,
			this.left,
		)
	}

	/** Collapse directional value by directional key. */
	collapseValueBy(key: DirectionalKey, value: number) {
		this[key] = Math.max(this[key], value)
	}

	/** Collapse directional value at direction. */
	collapseValueAt(direction: Direction, value: number) {
		let keys = direction.toDirectionalKeys()

		for (let key of keys) {
			this[key] = Math.max(this[key], value)
		}
	}

	/** Collapse with several directional objects into current, in all the direction. */
	collapse(...os: DirectionalObject[]): this {
		for (let o of os) {
			for (let key of Direction4Keys) {
				this[key] = Math.max(this[key], o[key])
			}
		}

		return this
	}

	/** 
	 * Collapse with a directional object,
	 * The margins that betweens current and `o` will be reset to `0`.
	 * `direction` specifies the direction of `o` relative to current.
	 */
	collapseAt(o: DirectionalObject, direction: Direction) {
		let meIgnoreKeys = direction.toDirectionalKeys()
		let oIgnoreKeys = direction.opposite.toDirectionalKeys()

		for (let key of meIgnoreKeys) {
			this[key] = 0
		}

		for (let key of Direction4Keys) {
			if (!oIgnoreKeys.includes(key)) {
				this[key] = Math.max(this[key], o[key])
			}
		}
	}

	/** Pick values by specified directional keys, values at other directions will become `0`. */
	pickBy(keys: DirectionalKey[]): DirectionalObject {
		let {top, right, bottom, left} = this

		top = keys.includes('top') ? top : 0
		right = keys.includes('right') ? right : 0
		bottom = keys.includes('bottom') ? bottom : 0
		left = keys.includes('left') ? left : 0

		return new DirectionalObject(
			top,
			right,
			bottom,
			left,
		)
	}

	/** Pick values at specified direction, values at other directions will become `0`. */
	pickAt(direction: Direction): DirectionalObject {
		let keys = direction.toDirectionalKeys()
		return this.pickBy(keys)
	}

	/** Multiply scalar value, returns a new object. */
	multiplyScalar(factor: number): DirectionalObject {
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
	round(): DirectionalObject {
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
	ceil(): DirectionalObject {
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
	floor(): DirectionalObject {
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
	toJSON(): Record<DirectionalKey, number> {
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
