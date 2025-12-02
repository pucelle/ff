import {MethodsObserved, GetObserved} from 'lupos'
import * as MathUtils from './math-utils'
import {Coord, MatrixLike} from './types'


/** A Vector represent a vector at 2d panel. */
export class Vector implements MethodsObserved<
	'clone' | 'equals' | 'isZero' | 'angleInDegree' | 'angle' | 'round' | 'ceil' | 'floor'
		| 'getLengthSquare' | 'getLength' | 'add' | 'sub' | 'multiply' | 'complexMultiply'
		| 'multiplyScalar' | 'divide' | 'complexDivide' | 'divideScalar' | 'negative' | 'rotate'
		| 'rotateInDegree' | 'transform' | 'normalize' | 'mix' | 'getRotateAngleFrom' | 'getRotateAngleInDegreeFrom'
		| 'getRotateFlagFrom' | 'dot' | 'cross' | 'projectTo' | 'restAfterProjectTo' | 'backProjectFrom'
		| 'toJSON',
	'set' | 'reset' | 'copyFrom' | 'roundSelf' | 'ceilSelf' | 'floorSelf' | 'addSelf' | 'subSelf'
		| 'multiplySelf' | 'complexMultiplySelf' | 'multiplyScalarSelf' | 'divideSelf' | 'complexDivideSelf'
		| 'divideScalarSelf' | 'negativeSelf' | 'rotateSelf' | 'rotateInDegreeSelf' | 'transformSelf'
		| 'normalizeSelf' | 'mixSelf'
> {

	/** Make a vector from a coord. */
	static from(coord: GetObserved<Coord>): Vector {
		return new Vector(coord.x, coord.y)
	}

	/** Minus from a point to another to get a difference vector. */
	static fromDiff(coord1: GetObserved<Coord>, coord2: GetObserved<Coord>): Vector {
		let x = coord1.x - coord2.x
		let y = coord1.y - coord2.y

		return new Vector(x, y)
	}

	/** Make a vector to represent a rotating vector from an angle in degree. */
	static fromDegree(degree: number): Vector {
		return Vector.fromRadians(degree / 180 * Math.PI)
	}

	/** Make a vector to represent a rotating vector from an angle in radians. */
	static fromRadians(radians: number): Vector {
		return new Vector(Math.cos(radians), Math.sin(radians))
	}

	
	x: number
	y: number

	constructor(x: number = 0, y: number = 0) {
		this.x = x
		this.y = y
	}

	/** Set vector values. */
	set(x: number, y: number) {
		this.x = x
		this.y = y
	}

	/** Reset vector values to `0`. */
	reset() {
		this.x = 0
		this.y = 0
	}

	/** Copy values from a coord to current. */
	copyFrom(coord: GetObserved<Coord>) {
		this.x = coord.x
		this.y = coord.y
	}
	
	/** Clone current vector. */
	clone() {
		return new Vector(this.x, this.y)
	}

	/** Whether vector values equals the coord parameters. */
	equals(coord: GetObserved<Coord>): boolean {
		return this.x === coord.x && this.y === coord.y
	}

	/** Whether be zero vector */
	isZero(): boolean {
		return this.x === 0 && this.y === 0
	}

	/** Get vector angle in degree, betweens `-180~180`. */
	angleInDegree(): number {
		return MathUtils.radiansToDegree(this.angle())
	}

	/** Get vector angle in radians, betweens `-π~π`. */
	angle() {
		return Math.atan2(this.y, this.x)
	}

	/** Round vector values, returns a new vector. */
	round(): Vector {
		return this.clone().roundSelf()
	}

	/** Round vector values. */
	roundSelf(): this {
		this.x = Math.round(this.x)
		this.y = Math.round(this.y)

		return this
	}

	/** Do Math Ceil to vector values, returns a new vector. */
	ceil(): Vector {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil to vector values. */
	ceilSelf(): this {
		this.x = Math.ceil(this.x)
		this.y = Math.ceil(this.y)

		return this
	}

	/** Do Math Floor to vector values, returns a new vector. */
	floor(): Vector {
		return this.clone().floorSelf()
	}

	/** Do Math Floor to vector values. */
	floorSelf(): this {
		this.x = Math.floor(this.x)
		this.y = Math.floor(this.y)

		return this
	}

	/** Get vector length square. */
	getLengthSquare(): number {
		return this.x * this.x + this.y * this.y
	}

	/** Get vector length. */
	getLength(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y)
	}

	/** Add another vector to current, returns a new vector. */
	add(v: GetObserved<Coord>): Vector {
		return this.clone().addSelf(v)
	}

	/** Add another vector to current. */
	addSelf(v: GetObserved<Coord>): this {
		this.x += v.x
		this.y += v.y

		return this
	}

	/** Subtract another vector from current, returns a new vector. */
	sub(v: GetObserved<Coord>): Vector {
		return this.clone().subSelf(v)
	}

	/** Subtract another vector from current. */
	subSelf(v: GetObserved<Coord>): this {
		this.x -= v.x
		this.y -= v.y

		return this
	}

	/** Multiple with another vector per component, returns a new vector. */
	multiply(v: GetObserved<Coord>): Vector {
		return this.clone().multiplySelf(v)
	}

	/** Multiple with another vector per component. */
	multiplySelf(v: GetObserved<Coord>): this {
		this.x *= v.x
		this.y *= v.y

		return this
	}

	/** 
	 * Complex multiply with another vector, returns a new vector.
	 * Complex multiply equals the multiply of vector rotation, and the multiply of vector model length.
	 */
	complexMultiply(v: GetObserved<Coord>): Vector {
		return this.clone().complexMultiplySelf(v)
	}

	/** 
	 * Complex multiply with another vector.
	 * Complex multiply equals the multiply of vector rotation, and the multiply of vector model length.
	 */
	complexMultiplySelf(v: GetObserved<Coord>): this {
		let x = this.x * v.x - this.y * v.y
		let y = this.x * v.y + this.y * v.x

		this.x = x
		this.y = y

		return this
	}

	/** Multiple with a scalar value per component, returns a new vector. */
	multiplyScalar(scale: number): Vector {
		return this.clone().multiplyScalarSelf(scale)
	}

	/** Multiple with a scalar value per component. */
	multiplyScalarSelf(scale: number): this {
		this.x *= scale
		this.y *= scale

		return this
	}

	/** Divide by another vector per component, returns a new vector. */
	divide(v: GetObserved<Coord>): Vector {
		return this.clone().divideSelf(v)
	}

	/** Divide by another vector per component. */
	divideSelf(v: GetObserved<Coord>): this {
		this.x /= v.x
		this.y /= v.y

		return this
	}

	/** 
	 * Complex divide by another vector, returns a new vector.
	 * Equals rotating according to conjugate of `v`, and divide v's model length.
	 */
	complexDivide(v: GetObserved<Vector>): Vector {
		return this.clone().complexDivideSelf(v)
	}

	/** 
	 * Complex divide by another vector.
	 * Equals rotating according to conjugate of `v`, and divide v's model length.
	 */
	complexDivideSelf(v: GetObserved<Vector>): this {

		// a ÷ b = a * conjugate(b) / |b|^2

		let x = this.x * v.x + this.y * v.y
		let y = -this.x * v.y + this.y * v.x
		let square = v.getLengthSquare()

		this.x = x / square
		this.y = y / square

		return this
	}

	/** Divide by a scalar value per component, returns a new vector. */
	divideScalar(scale: number): Vector {
		return this.clone().divideScalarSelf(scale)
	}

	/** Divide by a scalar value per component. */
	divideScalarSelf(scale: number): this {
		this.x /= scale
		this.y /= scale

		return this
	}

	/** Negative current vector to get a new vector, returns the new one. */
	negative(): Vector {
		return this.multiplyScalar(-1)
	}
	
	/** Negative current vector. */
	negativeSelf(): this {
		return this.multiplyScalarSelf(-1)
	}

	/** Rotate current vector with an angle in radians, returns a new vector. */
	rotate(radians: number): Vector {
		return this.clone().rotateSelf(radians)
	}

	/** Rotate current vector with an angle in radians. */
	rotateSelf(radians: number): this {
		let cos = Math.cos(radians)
		let sin = Math.sin(radians)
		let {x, y} = this
		
		this.x = x * cos - y * sin
		this.y = x * sin + y * cos
		
		return this
	}

	/** Rotate current vector with an angle in degree, returns a new vector. */
	rotateInDegree(degree: number): Vector {
		return this.rotate(MathUtils.degreeToRadians(degree))
	}

	/** Rotate current vector with an angle in degree. */
	rotateInDegreeSelf(degree: number): this {
		return this.rotateSelf(MathUtils.degreeToRadians(degree))
	}

	/** Transform current vector to get a new one. */
	transform(matrix: GetObserved<MatrixLike>): Vector {
		return this.clone().transformSelf(matrix)
	}

	/** Transform current vector. */
	transformSelf(matrix: GetObserved<MatrixLike>): this {
		let {a, b, c, d} = matrix
		let {x, y} = this

		this.x = a * x + c * y,
		this.y = b * x + d * y

		return this
	}

	/** Normalize current vector to an Unit Vector, returns the new vector. */
	normalize(): Vector {
		return this.clone().normalizeSelf()
	}
	
	/** Normalize current vector to an Unit Vector.  */
	normalizeSelf(): this {
		let length = this.getLength()
		let scale = isFinite(length) ? 1 / length : 0
		this.x *= scale
		this.y *= scale

		return this
	}

	/** Mix with `v` to get a new one. */
	mix(v: GetObserved<Vector>, vRate: number): Vector {
		return this.clone().mixSelf(v, vRate)
	}

	/** Mix with `v` to self. */
	mixSelf(v: GetObserved<Vector>, vRate: number): this {
		this.x = this.x * (1 - vRate) + v.x * vRate
		this.y = this.y * (1 - vRate) + v.y * vRate

		return this
	}
	
	/** Get the rotate angle in radians that can rotate from `v` to current. */
	getRotateAngleFrom(v: GetObserved<Vector>): number {
		return this.complexDivide(v).angle()
	}

	/** Get the rotate angle in degree that can rotate from `v` to current. */
	getRotateAngleInDegreeFrom(v: GetObserved<Vector>): number {
		return MathUtils.radiansToDegree(this.getRotateAngleFrom(v))
	}
	
	/** Get the rotate flag that represent whether rotation from `v` is clockwise(1) or anti-clockwise(0). */
	getRotateFlagFrom(v: GetObserved<Vector>): 0 | 1 {
		let divided = this.complexDivide(v)
		if (divided.y > 0) {
			return 1
		}
		else {
			return 0
		}
	}

	/** Dot product current vector with `v`. */
	dot(v: GetObserved<Vector>): number {
		return this.x * v.x + this.y * v.y
	}

	/** 
	 * Calculate cross product value betweens current vector and `v`.
	 * Returned value equals the area of parallelogram from these two vectors,
	 * But be positive when the angle rotated from current vector to another less than `180°`.
	 */
	cross(v: GetObserved<Vector>): number {
		return this.x * v.y - this.y * v.x
	}

	/** 
	 * Project current vector to `v`, returns the projected result.
	 * Returned vector will have the same direction with `v`.
	 */
	projectTo(v: GetObserved<Vector>): Vector {
		return v.multiplyScalar(this.dot(v) / v.getLengthSquare())
	}
	
	/** Get the rest value which from current vector minus the projection from current to another. */
	restAfterProjectTo(v: GetObserved<Vector>): Vector {
		return this.sub(this.projectTo(v))
	}

	/** 
	 * Already know that current vector is a projection vector,
	 * and knows an vector `directionV` pointed out the original direction,
	 * restore the original vector and return it.
	 */
	backProjectFrom(directionV: GetObserved<Vector>): Vector {

		// Assume it projects from `t` to `v`, get vector `p`.
		// cosθ = t·v / (|t|*|v|)
		// p = cosθ * |t| * v / |v|
		// |p| = cosθ * |t|
		// |t| = |p| / cosθ
		// t = |t| * directionVNormal
		
		let dLength = directionV.getLength()
		let pLength = this.getLength()
		let cos = directionV.dot(this) / (dLength * pLength)
		let tLength = cos === 0 ? 0 : pLength / cos

		return directionV.multiplyScalar(tLength / dLength)
	}

	/** Convert to JSON data. */
	toJSON(): Coord {
		return {
			x: this.x,
			y: this.y,
		}
	}
}