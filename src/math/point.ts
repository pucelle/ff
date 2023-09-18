import {MathUtils} from './math-utils'
import {Vector} from './vector'


/* Represent a point at 2d panel. */
export class Point {

	/** Constant zero point. */
	static Zero: Readonly<Point> = Object.freeze(new Point(0, 0))

	/** Make a point from a coord. */
	static fromCoord(coord: Coord): Point {
		return new Point(coord.x, coord.y)
	}

	/** Make a point from an angle in degree. */
	static fromDegree(degree: number): Point {
		return Point.fromRadians(MathUtils.degreeToRadians(degree))
	}

	/** Make a point from an angle in radians. */
	static fromRadians(radians: number): Point {
		return new Point(Math.cos(radians), Math.sin(radians))
	}

	x: number
	y: number

	constructor(x: number = 0, y: number = 0) {
		this.x = x
		this.y = y
	}

	/** Set point values. */
	set(x: number, y: number) {
		this.x = x
		this.y = y
	}

	/** Reset point values to `0`. */
	reset() {
		this.x = 0
		this.y = 0
	}

	/** Copy values from a coord to current. */
	copyFrom(coord: Coord) {
		this.x = coord.x
		this.y = coord.y
	}

	/** Clone current point. */
	clone(): Point {
		return new Point(this.x, this.y)
	}

	/** Whether equlas to another point. */
	equals(p: Point) {
		return this.x === p.x && this.y === p.y
	}

	/** Convert to a vector. */
	asVector(): Vector {
		return new Vector(this.x, this.y)
	}

	/** Whether be zero point */
	isZero(): boolean {
		return this.x === 0 && this.y === 0
	}
	
	/** Round position values, returns a new point. */
	round(): Point {
		return this.clone().roundSelf()
	}

	/** Round position values. */
	roundSelf(): this {
		this.x = Math.round(this.x)
		this.y = Math.round(this.y)

		return this
	}

	/** Do Math Ceil at position values, returns a new point. */
	ceil(): Point {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil at position values. */
	ceilSelf(): this {
		this.x = Math.ceil(this.x)
		this.y = Math.ceil(this.y)

		return this
	}

	/** Do Math Floor at position values, returns a new point. */
	floor(): Point {
		return this.clone().floorSelf()
	}

	/** Do Math Floor at position values. */
	floorSelf(): this {
		this.x = Math.floor(this.x)
		this.y = Math.floor(this.y)

		return this
	}

	/** Add a vector to current point, returns a new point. */
	add(v: Vector): Point {
		return this.clone().addSelf(v)
	}

	/** Add a vector to current point. */
	addSelf(v: Vector): this {
		this.x += v.x
		this.y += v.y

		return this
	}

	/** Sub a vector from current point, returns a new point. */
	sub(v: Vector): Point {
		return this.clone().subSelf(v)
	}

	/** Sub a vector from current point. */
	subSelf(v: Vector): this {
		this.x -= v.x
		this.y -= v.y

		return this
	}

	/** Make a translate by x,y, returns a new point. */
	translate(x: number, y: number): Point {
		return this.clone().translateSelf(x, y)
	}

	/** Make a translate by x,y. */
	translateSelf(x: number, y: number): this {
		this.x += x
		this.y += y

		return this
	}

	/** Minus another point to get a vector. */
	diff(p: Point): Vector {
		let x = this.x - p.x
		let y = this.y - p.y

		return new Vector(x, y)
	}

	/** Mix with a point to get a new point. */
	mix(p: Point, pRate: number): Point {
		let x = this.x * (1 - pRate) + p.x * pRate
		let y = this.y * (1 - pRate) + p.y * pRate

		return new Point(x, y)
	}

	/** Get the distance to another point. */
	distanceTo(p: Point): number {
		let x = this.x - p.x
		let y = this.y - p.y

		return Math.sqrt(x * x + y * y)
	}

	/** Convert to JSON data. */
	toJSON(): Coord {
		return {
			x: this.x,
			y: this.y,
		}
	}
}
