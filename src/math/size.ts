import {Matrix} from './matrix'


export class Size {

	/** Zero size object. */
	static Zero: Readonly<Size> = Object.freeze(new Size())

	/** Make a size object, from a size-like object, such as `Box`. */
	static fromLike(sizeLike: SizeLike): Size {
		return new Size(sizeLike.width, sizeLike.height)
	}

	width: number
	height: number

	constructor(width: number = 0, height: number = 0) {
		this.width = width
		this.height = height
	}

	/** Get area value of current size, equals `width * height`. */
	get area(): number {
		return this.width * this.height
	}

	/** Whether size is empty and not have any space. */
	get empty(): boolean {
		return this.width <= 0 && this.height <= 0
	}

	/** Set size values. */
	set(width: number, height: number) {
		this.width = width
		this.height = height
	}

	/** Reset size values to become zero. */
	reset() {
		this.width = 0
		this.height = 0
	}

	/** Copy values from a size to current. */
	copyFrom(s: SizeLike) {
		this.width = s.width
		this.height = s.height
	}

	/** Clone size, returns a new one. */
	clone(): Size {
		return new Size(this.width, this.height)
	}

	/** Round size values, returns a new box. */
	round(): Size {
		return this.clone().roundSelf()
	}

	/** Round size values. */
	roundSelf(): this {
		this.width = Math.round(this.width)
		this.height = Math.round(this.height)

		return this
	}

	/** Do Math Ceil to size values, returns a new box. */
	ceil(): Size {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil to size values. */
	ceilSelf(): this {
		this.width = Math.ceil(this.width)
		this.height = Math.ceil(this.height)

		return this
	}

	/** Do Math Floor to size values, returns a new box. */
	floor(): Size {
		return this.clone().floorSelf()
	}

	/** Do Math Floor to size values. */
	floorSelf(): this {
		this.width = Math.floor(this.width)
		this.height = Math.floor(this.height)

		return this
	}

	/** Whether equals another box. */
	equals(s: SizeLike): boolean {
		return this.width === s.width
			&& this.height === s.height
	}

	/** Transform current size to get a new one. */
	transform(matrix: Matrix): Size {
		return this.clone().transformSelf(matrix)
	}

	/** Transform current size to get a new one. */
	transformSelf(matrix: Matrix): this {
		let {a, b, c, d} = matrix
		let {width, height} = this

		this.width = a * width + c * height
		this.height = b * width + d * height

		return this
	}

	/** Convert to JSON data. */
	toJSON(): SizeLike {
		return {
			width: this.width,
			height: this.height,
		}
	}
}