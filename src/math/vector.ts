import {MathUtils} from './math-utils'
import {Matrix2} from './matrix2'
import {Point} from './point'


/** A Vector represent a vector at 2d panel. */
export class Vector {

	/** Zero vector. */
	static Zero: Readonly<Vector> = Object.freeze(new Vector(0, 0))

	/** Make a vector from a coord. */
	static fromCoord(coord: Coord): Vector {
		return new Vector(coord.x, coord.y)
	}

	/** Make a vector from an angle in degree. */
	static fromDegree(degree: number): Vector {
		return Vector.fromRadians(degree / 180 * Math.PI)
	}

	/** Make a vector from an angle in radians. */
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
	copyFrom(coord: Coord) {
		this.x = coord.x
		this.y = coord.y
	}
	
	/** Clone current vector. */
	clone() {
		return new Vector(this.x, this.y)
	}

	/** Whether vector values equals the coord parameters. */
	equals(coord: Vector): boolean {
		return this.x === coord.x && this.y === coord.y
	}

	/** Convert current vector to a point. */
	asPoint(): Point {
		return new Point(this.x, this.y)
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

	/** Do Math Ceil at vector values, returns a new vector. */
	ceil(): Vector {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil at vector values. */
	ceilSelf(): this {
		this.x = Math.ceil(this.x)
		this.y = Math.ceil(this.y)

		return this
	}

	/** Do Math Floor at vector values, returns a new vector. */
	floor(): Vector {
		return this.clone().floorSelf()
	}

	/** Do Math Floor at vector values. */
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

	/** Add another vector, returns a new vector. */
	add(v: Vector): Vector {
		return this.clone().addSelf(v)
	}

	/** Add another vector to current. */
	addSelf(v: Vector): this {
		this.x += v.x
		this.y += v.y

		return this
	}

	/** Subtract another vector, returns a new vector. */
	sub(v: Vector): Vector {
		return this.clone().subSelf(v)
	}

	/** Subtract another vector from current. */
	subSelf(v: Vector): this {
		this.x -= v.x
		this.y -= v.y

		return this
	}

	/** Multiple with another vector per component, returns a new vector. */
	multiply(v: Vector): Vector {
		return this.clone().multiplySelf(v)
	}

	/** Multiple with another vector per component. */
	multiplySelf(v: Vector): this {
		this.x *= v.x
		this.y *= v.y

		return this
	}

	/** Complex multiply with another vector, returns a new vector. */
	complexMultiply(v: Vector): Vector {
		return this.clone().complexMultiplySelf(v)
	}

	/** Complex multiply with another vector. */
	complexMultiplySelf(v: Vector): this {
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
	divide(v: Vector): Vector {
		return this.clone().divideSelf(v)
	}

	/** Divide by another vector per component. */
	divideSelf(v: Vector): this {
		this.x /= v.x
		this.y /= v.y

		return this
	}

	/** 
	 * Complex divide by another vector, returns a new vector.
	 * `V1` divide `V2` is nearly equals rotating `V1` according to `V2` in opposite direction,
	 * and divide model length of `V2`.
	 */
	complexDivide(v: Vector): Vector {
		return this.clone().complexDivideSelf(v)
	}

	/** Complex divide by another vector. */
	complexDivideSelf(v: Vector): this {

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

	/** Negative current vector to a new vector, returns the new one. */
	negative(): Vector {
		return this.multiplyScalar(-1)
	}
	
	/** Negative current vector. */
	negativeSelf(): this {
		return this.multiplyScalarSelf(-1)
	}

	/** Rotate an angle in radians, returns a new vector. */
	rotate(radians: number): Vector {
		return this.clone().rotateSelf(radians)
	}

	/** Rotate an angle in radians. */
	rotateSelf(radians: number): this {
		let cos = Math.cos(radians)
		let sin = Math.sin(radians)
		let {x, y} = this
		
		this.x = x * cos - y * sin
		this.y = x * sin + y * cos
		
		return this
	}

	/** Rotate an angle in degree, returns a new vector. */
	rotateInDegree(degree: number): Vector {
		return this.rotate(MathUtils.degreeToRadians(degree))
	}

	/** Rotate an angle in degree. */
	rotateInDegreeSelf(degree: number): this {
		return this.rotateSelf(MathUtils.degreeToRadians(degree))
	}

	/** Normalize to an unit vector, returns the new vector.  */
	normalize(): Vector {
		return this.clone().normalizeSelf()
	}
	
	/** Normalize to an unit vector.  */
	normalizeSelf(): this {
		let length = this.getLength()
		let scale = isFinite(length) ? 1 / length : 0
		this.x *= scale
		this.y *= scale

		return this
	}

	/** Mix with a vector to get a new vector. */
	mix(v: Vector, vRate: number): Vector {
		let x = this.x * (1 - vRate) + v.x * vRate
		let y = this.y * (1 - vRate) + v.y * vRate

		return new Vector(x, y)
	}
	
	/** Get the rotate angle in radians that can rotate from a vector to current. */
	getRotateAngleFrom(v: Vector): number {
		return this.complexDivide(v).angle()
	}

	/** Get the rotate angle in degree that can rotate from a vector to current. */
	getRotateAngleInDegreeFrom(v: Vector): number {
		return MathUtils.radiansToDegree(this.getRotateAngleFrom(v))
	}
	
	/** Get the rotate flag that represent whether rotation clockwise (1) or anti-clockwise (0). */
	getRotateFlagFrom(v: Vector): 0 | 1 {
		let divided = this.complexDivide(v)
		if (divided.y > 0) {
			return 1
		}
		else {
			return 0
		}
	}

	/** Dot multiply current vector with another vector. */
	dot(v: Vector): number {
		return this.x * v.x + this.y * v.y
	}

	/** 
	 * Calculate cross product value betweens current vector and another vector.
	 * Returned value equals the area of parallelogram from these two vectors,
	 * But be positive when the angle rotated from current vector to another less than `180`.
	 * 
	 * Otherwise, it seems no meaning for 2d vectors to do crossing,
	 * here it just assumes that the z component is `0`, and do 3d crossing.
	 */
	cross(v: Vector): number {
		return this.x * v.y - this.y * v.x
	}

	/** 
	 * Project current vector to another.
	 * Returned vector will have the same direction with another vector.
	 */
	projectTo(v: Vector): Vector {
		return v.multiplyScalar(this.dot(v) / v.getLengthSquare())
	}
	
	/** Get the rest value which from current vector minus the projection from current to another. */
	restAfterProjectTo(v: Vector): Vector {
		return this.sub(this.projectTo(v))
	}

	/** 
	 * Already know that current vector is a projection vector,
	 * and knows an vector point out the original direction,
	 * Restore the original vector.
	 */
	backProjectFrom(directionV: Vector): Vector {

		// Assume already project from `t` to `v`, get vector `p`.
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

	/** Decompress current vector to `μ * a + ν * b`, got `(μ, ν)`. */
	decompresFactor(a: Vector, b: Vector): Vector {

		// [a b] * [μ ν]^T = diff
		// [μ ν]^T = [a b]^-1 * diff

		return Matrix2.fromCoords(a, b).inverse().transformVector(this)
	}

	/** Decompress current vector to `μ * a + ν * b`, got an vector pair `[μ * a, ν * b]`. */
	decompress(a: Vector, b: Vector): [Vector, Vector] {
		let {x: m, y: v} = this.decompresFactor(a, b)
		return [a.multiplyScalar(m), b.multiplyScalar(v)]
	}

	/** Convert to JSON data. */
	toJSON(): Coord {
		return {
			x: this.x,
			y: this.y,
		}
	}
}