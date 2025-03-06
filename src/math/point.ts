import {MethodsObserved} from '../observer'
import * as MathUtils from './math-utils'
import {Vector} from './vector'


/* Represent a point at 2d panel. */
export class Point implements MethodsObserved<
	'clone' | 'equals' | 'isZero' | 'round' | 'ceil' | 'floor' | 'add' | 'sub' | 'translate'
		| 'translateBy' | 'transform' | 'mix' | 'diff' | 'distanceTo' | 'toJSON',
	'set' | 'reset' | 'copyFrom' | 'roundSelf' | 'ceilSelf' | 'floorSelf' | 'addSelf' | 'subSelf'
		| 'translateSelf' | 'translateBySelf' | 'mixSelf' | 'transformSelf'
> {

	/** Constant zero point. */
	static Zero: Readonly<Point> = Object.freeze(new Point(0, 0))

	/** Make a point from a coord. */
	static from(coord: Coord): Point {
		return new Point(coord.x, coord.y)
	}

	/** Make a point represent the end point of a rotating vector from an angle in degree. */
	static fromDegree(degree: number): Point {
		return Point.fromRadians(MathUtils.degreeToRadians(degree))
	}

	/** Make a point represent the end point of a rotating vector from an angle in radians. */
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

	/** Copy values from a coord to current point. */
	copyFrom(coord: Coord) {
		this.x = coord.x
		this.y = coord.y
	}

	/** Clone current point. */
	clone(): Point {
		return new Point(this.x, this.y)
	}

	/** Whether equals to another point. */
	equals(p: Point) {
		return this.x === p.x && this.y === p.y
	}

	/** Whether be zero point. */
	isZero(): boolean {
		return this.x === 0 && this.y === 0
	}
	
	/** Round point values, returns a new point. */
	round(): Point {
		return this.clone().roundSelf()
	}

	/** Round point values. */
	roundSelf(): this {
		this.x = Math.round(this.x)
		this.y = Math.round(this.y)

		return this
	}

	/** Do Math Ceil to point values, returns a new point. */
	ceil(): Point {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil to point values. */
	ceilSelf(): this {
		this.x = Math.ceil(this.x)
		this.y = Math.ceil(this.y)

		return this
	}

	/** Do Math Floor to point values, returns a new point. */
	floor(): Point {
		return this.clone().floorSelf()
	}

	/** Do Math Floor to point values. */
	floorSelf(): this {
		this.x = Math.floor(this.x)
		this.y = Math.floor(this.y)

		return this
	}

	/** Add a vector to current point, returns a new point. */
	add(v: Coord): Point {
		return this.clone().addSelf(v)
	}

	/** Add a vector to current point. */
	addSelf(v: Coord): this {
		this.x += v.x
		this.y += v.y

		return this
	}

	/** Subtract a vector from current point, returns a new point. */
	sub(v: Coord): Point {
		return this.clone().subSelf(v)
	}

	/** Subtract a vector from current point. */
	subSelf(v: Coord): this {
		this.x -= v.x
		this.y -= v.y

		return this
	}

	/** Translate current point by x, y value specified, returns a new point. */
	translate(x: number, y: number): Point {
		return this.clone().translateSelf(x, y)
	}

	/** Translate current point by x, y value specified. */
	translateSelf(x: number, y: number): this {
		this.x += x
		this.y += y

		return this
	}

	/** Translate current point by coord specified, returns a new point. */
	translateBy(coord: Coord): Point {
		return this.clone().translateBySelf(coord)
	}

	/** Translate current point by coord specified. */
	translateBySelf(coord: Coord): this {
		this.x += coord.x
		this.y += coord.y

		return this
	}

	/** Transform current point to get a new one. */
	transform(matrix: MatrixData): Point {
		return this.clone().transformSelf(matrix)
	}

	/** Transform current point. */
	transformSelf(matrix: MatrixData): this {
		let {a, b, c, d, e, f} = matrix
		let {x, y} = this

		this.x = a * x + c * y + e
		this.y = b * x + d * y + f
		
		return this
	}

	/** Mix with another point to get a new point. */
	mix(p: Point, pRate: number): Point {
		return this.clone().mixSelf(p, pRate)
	}

	/** Mix with another point to self. */
	mixSelf(p: Point, pRate: number): this {
		this.x = this.x * (1 - pRate) + p.x * pRate
		this.y = this.y * (1 - pRate) + p.y * pRate

		return this
	}

	/** Minus another point to get a difference vector. */
	diff(p: Point): Vector {
		let x = this.x - p.x
		let y = this.y - p.y

		return new Vector(x, y)
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
