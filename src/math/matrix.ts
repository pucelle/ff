import {Vector} from './vector'
import {Point} from './point'
import {Box} from './box'
import * as MathUtils from './math-utils'
import {Size} from './size'
import {MethodsObserved, GetObserved} from '@pucelle/lupos'
import {BoxLike, Coord, MatrixLike, SizeLike} from './types'


/** Represents a 2D Transform Matrix. */
export class Matrix implements MatrixLike, MethodsObserved<
	'clone' | 'equals' | 'isI' | 'isZero' | 'isRigid' | 'isSimilar' | 'isSkewed' | 'isMirrored'
		| 'getDeterminant' | 'getEigenValues' | 'getPrimaryScaling' | 'getSecondaryScaling' | 'multiply'
		| 'multiplyScalar' | 'preMultiply' | 'translate' | 'translateBy' | 'scale' | 'rotateInDegree'
		| 'rotate' | 'skewInDegree' | 'skew' | 'inverse' | 'transformPoint' | 'transformVector'
		| 'transformBox' | 'transformSize' | 'mix',
	'set' | 'reset' | 'copyFrom' | 'multiplySelf' | 'multiplyScalarSelf' | 'preMultiplySelf' | 'translateSelf'
		| 'translateBySelf' | 'scaleSelf' | 'rotateInDegreeSelf' | 'rotateSelf' | 'skewInDegreeSelf'
		| 'skewSelf' | 'invertSelf' | 'mixSelf'
> {

	/** Returns a new Identity Matrix. */
	static i(): Matrix {
		return new Matrix(1, 0, 0, 1, 0, 0)
	}

	/** Returns a Zero Matrix. */
	static zero(): Matrix {
		return new Matrix(0, 0, 0, 0, 0, 0)
	}

	/** 
	 * Parse string like `matrix(...)` to a matrix.
	 * Returns a zero matrix if parse failed.
	 */
	static fromString(str: string): Matrix {
		let re = /matrix\s*\((.+?)\)/
		let match = str.match(re)

		if (match) {
			let values = match[1].split(/,\s*/).map(v => Number(v))

			return new Matrix(
				values[0],
				values[1],
				values[2],
				values[3],
				values[4],
				values[5],
			)
		}

		return Matrix.i()
	}

	/** Make a matrix from a matrix like object. */
	static fromMatrixLike(md: GetObserved<MatrixLike>): Matrix {
		let {a, b, c, d, e, f} = md
		return new Matrix(a, b, c, d, e, f)
	}

	/** Create a matrix from 2 Coords. */
	static fromCoords(c1: GetObserved<Coord>, c2: GetObserved<Coord>) {
		return new Matrix(
			c1.x, c1.y,
			c2.x, c2.y,
			0, 0
		)
	}

	/** 
	 * Make a transform matrix, which will convert `fromBox` to `toBox`.
	 * 
	 * `fitMode` decides how to fit from element with to element.
	 *  - `contain`: from element to be contained by to element.
	 *  - `cover`: from element covers to element.
	 *  - `stretch`: stretch from element to fit to element's width and height.
	 * Default value is `stretch`.
	 */
	static fromBoxPair(fromBox: GetObserved<BoxLike>, toBox: GetObserved<BoxLike>, fitMode: 'contain' | 'cover' | 'stretch' = 'stretch'): Matrix {
		let fromX = fromBox.x + fromBox.width / 2
		let fromY = fromBox.y + fromBox.height / 2
		let toX = toBox.x + toBox.width / 2
		let toY = toBox.y + toBox.height / 2

		let scaleX = toBox.width / fromBox.width
		let scaleY = toBox.height / fromBox.height

		if (fitMode === 'contain') {
			scaleX = scaleY = Math.min(scaleX, scaleY)
		}
		else if (fitMode === 'cover') {
			scaleX = scaleY = Math.max(scaleX, scaleY)
		}

		let matrix = Matrix.i()
			.translateSelf(-fromX, -fromY)
			.scaleSelf(scaleX, scaleY)
			.translateSelf(toX, toY)

		return matrix
	}

	/** Decompress a vector to `μ * a + ν * b`, returns factor vector of `(μ, ν)`. */
	static decompressFactor(from: GetObserved<Vector>, a: GetObserved<Vector>, b: GetObserved<Vector>): Vector {

		// [a b] * [μ ν]^T = diff
		// [μ ν]^T = [a b]^-1 * diff

		return Matrix.fromCoords(a, b).inverse().transformVector(from)
	}

	/** Decompress a vector to `μ * a + ν * b`, returns an vector pair `[μ * a, ν * b]`. */
	static decompress(from: GetObserved<Vector>, a: GetObserved<Vector>, b: GetObserved<Vector>): [Vector, Vector] {
		let {x: m, y: v} = Matrix.decompressFactor(from, a, b)
		return [a.multiplyScalar(m), b.multiplyScalar(v)]
	}

	
	/** 
	 * Make a transform matrix which will transform from two start points, to two final points.
	 * Ignore skew transform.
	 * Can be used for calculating transform matrix of pinch event.
	 */
	static makeNonSkewMatrixFromPoints(
		fromPoints: [GetObserved<Point>, GetObserved<Point>],
		toPoints: [GetObserved<Point>, GetObserved<Point>]
	): Matrix {

		// Let it transform from C1 and C2, to C3 and C4:

		// M = Translate(x, y) * Rotate(θ) * Scale(s)
		// M * [C1, C2] = [C3, C4]

		// [a c e] = Translate(e, f) * Rotate(θ) * Scale(s)
		// [b d f]
		// =>
		//   [a c] = Rotate(θ) * Scale(s)
		//   [b d]
		// =>
		//   [cosθ -sinθ][s 0] = [a c]
		//   [sinθ  cosθ][0 s] = [b d]
		// =>
		//   c = -b
		//   d = a

		// [a -b e] * [c1x] = [c3x]
		// [b  a f]   [c1y]   [c3y]
		// =>
		//    a*c1x - b*c1y + e = c3x		...1
		//    b*c1x + a*c1y + f = c3y		...2
		//    a*c2x - b*c2y + e = c4x		...3
		//    b*c2x + a*c2y + f = c4y		...4
		//
		// 1 - 3, 2 - 4 =>
		//    a(c1x - c2x) - b(c1y - c2y) = c3x - c4x
		//    b(c1x - c2x) + a(c1y - c2y) = c3y - c4y
		// =>
		//    [c1x-c2x  -(c1y-c2y)] * [a] = [c3x - c4x]
		//    [c1y-c2y    c1x-c2x ]   [b]   [c3y - c4y]

		//    [a] = [c1x-c2x  -(c1y-c2y)]^-1 * [c3x - c4x]
		//    [b]   [c1y-c2y    c1x-c2x ]      [c3y - c4y]

		//    e = c3x - a*c1x + b*c1y
		//    f = c3y - b*c1x - a*c1y

		// To understand intuitively, 
		// Scaling rate equals vector length ratio,
		// Rotation angle equals vector rotation angle.

		let c1 = fromPoints[0]
		let c2 = fromPoints[1]
		let c3 = toPoints[0]
		let c4 = toPoints[1]
		let c12d = Vector.fromDiff(c1, c2)

		let m = new Matrix(
			 c12d.x, c12d.y,
			-c12d.y, c12d.x,
			0, 0
		)
		
		let v = Vector.fromDiff(c3, c4)
		let {x: a, y: b} = m.invertSelf().transformVector(v)
		let c = -b
		let d = a
		let e = c3.x - a * c1.x + b * c1.y
		let f = c3.y - b * c1.x - a * c1.y

		return new Matrix(a, b, c, d, e, f)
	}
		
	/** 
	 * Make a transform matrix which will transform from two start points, to two final points.
	 * Ignore rotation part.
	 * Can be used for calculating the transform matrix of pinch event.
	 */
	static makeNonRotationMatrixFromPoints(
		fromPoints: [GetObserved<Point>, GetObserved<Point>],
		toPoints: [GetObserved<Point>, GetObserved<Point>]
	): Matrix {

		// Let it transform from C1 and C2, to C3 and C4:

		// M = Translate(x, y) * Scaling(s)
		// s = Vector(C3, C4) / Vector(C1, C2)

		// [a 0 e] = Translate(e, f) * Scaling(s)
		// [0 a f]
		// => a = s

		// Let C5, C6 is the center of the two segments:
		// M * C5 = C6
		// =>
		//    [a 0 e] * [c5x] = [c6x]
		//    [0 a f]   [c5y]   [c6y]
		// =>
		//    a*c5x + e = c6x
		//    a*c5y + f = c6y
		// =>
		//    e = c6x - a*c5x
		//    f = c6y - a*c5y

		let c1 = fromPoints[0]
		let c2 = fromPoints[1]
		let c3 = toPoints[0]
		let c4 = toPoints[1]
		let c5 = c1.mix(c2, 0.5)
		let c6 = c3.mix(c4, 0.5)
		let v1 = Vector.fromDiff(c2, c1)
		let v2 = Vector.fromDiff(c4, c3)
		let a = v2.getLength() / v1.getLength()
		let b = 0
		let c = 0
		let d = a
		let e = c6.x - a * c5.x
		let f = c6.y - a * c5.y

		return new Matrix(a, b, c, d, e, f)
	}


	a: number
	b: number
	c: number
	d: number
	e: number
	f: number

	constructor(a: number, b: number, c: number, d: number, e: number, f: number) {
		this.a = a
		this.b = b
		this.c = c
		this.d = d
		this.e = e
		this.f = f
	}

	/** Set matrix data values. */
	set(a: number, b: number, c: number, d: number, e: number, f: number) {
		this.a = a
		this.b = b
		this.c = c
		this.d = d
		this.e = e
		this.f = f
	}

	/** Reset data values to become an Identify Matrix. */
	reset() {
		this.a = 1
		this.b = 0
		this.c = 0
		this.d = 1
		this.e = 0
		this.f = 0
	}

	/** Copy values from a matrix to current. */
	copyFrom(m: MatrixLike) {
		this.a = m.a
		this.b = m.b
		this.c = m.c
		this.d = m.d
		this.e = m.e
		this.f = m.f
	}

	/** Clone current matrix, returns a new one. */
	clone(): Matrix {
		let {a, b, c, d, e, f} = this
		return new Matrix(a, b, c, d, e, f)
	}

	/** Whether equals to another matrix. */
	equals(m: GetObserved<MatrixLike>): boolean {
		return this.a == m.a &&
			this.b == m.b &&
			this.c == m.c &&
			this.d == m.d &&
			this.e == m.e &&
			this.f == m.f
	}

	/** Whether be Identity Matrix. */
	isI(): boolean {
		let {a, b, c, d, e, f} = this

		return a === 1
			&& b === 0
			&& c === 0
			&& d === 1
			&& e === 0
			&& f === 0
	}

	/** Whether be Zero Matrix. */
	isZero(): boolean {
		let {a, b, c, d, e, f} = this

		return a === 0
			&& b === 0
			&& c === 0
			&& d === 0
			&& e === 0
			&& f === 0
	}

	/** Whether has only rotation happens. */
	isRigid(): boolean {
		let {a, b, c, d} = this

		return a * a + b * b === 1
			&& c * c + d * d === 1
	}

	/** Whether has only rotation and both-axises-equivalent scaling happens. */
	isSimilar(): boolean {
		let {a, b, c, d} = this
		return a * a + b * b === c * c + d * d
	}

	/** Whether has skewed and cause two axis isn't perpendicular with each other anymore. */
	isSkewed(): boolean {
		let {a, b, c, d} = this
		return a * a + c * c - b * b - d * d !== 0
	}

	/** 
	 * Whether transform cause mirrored.
	 * Means it will turn the backward to the front.
	 */
	isMirrored(): boolean {
		return this.getDeterminant() < 0
	}

	/** Get the Matrix Determinant Value. */
	getDeterminant(): number {
		let {a, b, c, d} = this
		return a * d - b * c
	}

	/** 
	 * Get the Matrix Eigen Values.
	 * Two eigen values will be sorted from lower to upper.
	 */
	getEigenValues(): [number, number] {

		// λ1λ2 = det
		// λ1 + λ2 = a + d
		// λ^2 - (a + d) * λ + det = 0

		let {a, b, c, d} = this
		let det = a * d - b * c
		let pad = a + d

		return MathUtils.solveOneVariableQuadraticEquation(1, -pad, det) || [0, 0]
	}

	/** 
	 * Get the primary scaling of current matrix.
	 * Which equals the larger eigen value after make it absolute.
	 */
	getPrimaryScaling(): number {
		
		// Another approximate algorithm is max(sqrt(a^2 + b^2), sqrt(b^2 + d^2), sqrt(d^2 + c^2), sqrt(c^2 + a^2)).
		// Which equals the maximum scaling in 2 axes.
		
		let values = this.getEigenValues()
		return Math.max(...values.map(Math.abs))
	}

	/** 
	 * Get the secondary scaling of current matrix.
	 * Which equals the smaller eigen value after make it absolute.
	 */
	getSecondaryScaling(): number {
		let values = this.getEigenValues()
		return Math.min(...values.map(Math.abs))
	}

	/** Post / Left multiply with `mr`, do `(this * mr)` and returns a new matrix. */
	multiply(mr: GetObserved<MatrixLike>): Matrix {
		return this.clone().multiplySelf(mr)
	}

	/** Post / Left multiply `mr`, do `(this * mr)` and apply result to self. */
	multiplySelf(mr: GetObserved<MatrixLike>): this {
		let ml = this

		let a = ml.a * mr.a + ml.c * mr.b
		let b = ml.b * mr.a + ml.d * mr.b
		let c = ml.a * mr.c + ml.c * mr.d
		let d = ml.b * mr.c + ml.d * mr.d
		let e = ml.a * mr.e + ml.c * mr.f + ml.e
		let f = ml.b * mr.e + ml.d * mr.f + ml.f

		this.a = a
		this.b = b
		this.c = c
		this.d = d
		this.e = e
		this.f = f

		return this
	}
	
	/** Multiply with a scalar value and returns a new matrix. */
	multiplyScalar(scale: number): Matrix {
		return this.clone().multiplyScalarSelf(scale)
	}

	/** Multiply with a scalar value to self. */
	multiplyScalarSelf(scale: number): this {
		this.a *= scale
		this.b *= scale
		this.c *= scale
		this.d *= scale
		this.e *= scale
		this.f *= scale

		return this
	}

	/** Pre / Right multiply with `ml`,  do `(ml * this)` and returns a new matrix. */
	preMultiply(ml: GetObserved<MatrixLike>): Matrix {
		return this.clone().preMultiplySelf(ml)
	}

	/** Pre / Right multiply with `ml`, do `(ml * this)` and apply result to self. */
	preMultiplySelf(ml: GetObserved<MatrixLike>): this {
		let mr = this

		let a = ml.a * mr.a + ml.c * mr.b
		let b = ml.b * mr.a + ml.d * mr.b
		let c = ml.a * mr.c + ml.c * mr.d
		let d = ml.b * mr.c + ml.d * mr.d
		let e = ml.a * mr.e + ml.c * mr.f + ml.e
		let f = ml.b * mr.e + ml.d * mr.f + ml.f

		this.a = a
		this.b = b
		this.c = c
		this.d = d
		this.e = e
		this.f = f

		return this
	}

	/** Merge a Translate transform to current matrix and returns a new matrix. */
	translate(x: number, y: number): Matrix {
		return this.clone().translateSelf(x, y)
	}

	/** Merge a Translate transform to current matrix. */
	translateSelf(x: number, y: number): this {
		return this.preMultiplySelf({
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: x,
			f: y,
		})
	}

	/** Merge a Translate transform to current matrix and returns a new matrix. */
	translateBy(v: GetObserved<Coord>): Matrix {
		return this.clone().translateBySelf(v)
	}

	/** Merge a Translate transform to current matrix. */
	translateBySelf(v: GetObserved<Coord>): this {
		return this.preMultiplySelf({
			a: 1,
			b: 0,
			c: 0,
			d: 1,
			e: v.x,
			f: v.y,
		})
	}

	/** Merge a Scaling transform to current matrix and returns a new matrix. */
	scale(x: number, y: number = x): Matrix {
		return this.clone().scaleSelf(x, y)
	}

	/** Merge a Scaling transform to current matrix. */
	scaleSelf(sx: number, sy: number = sx): this {
		return this.preMultiplySelf({
			a: sx,
			b: 0,
			c: 0,
			d: sy,
			e: 0,
			f: 0,
		})
	}

	/** Rotate by angle in degree, in clock-wise direction, returns a new matrix. */
	rotateInDegree(degree: number): Matrix {
		return this.rotate(MathUtils.degreeToRadians(degree))
	}

	/** Rotate by angle in degree, in clock-wise direction. */
	rotateInDegreeSelf(degree: number): this {
		return this.rotateSelf(MathUtils.degreeToRadians(degree))
	}

	/** Rotate by angle in radians, in clock-wise direction, returns a new matrix. */
	rotate(radians: number): Matrix {
		return this.clone().rotateSelf(radians)
	}

	/** Rotate by angle in radians, in clock-wise direction. */
	rotateSelf(radians: number): this {
		let sin = Math.sin(radians),
			cos = Math.cos(radians)

		return this.preMultiplySelf({
			a: cos,
			b: sin,
			c: -sin,
			d: cos,
			e: 0,
			f: 0,
		})
	}

	/** 
	 * Skew by angle in degree, in clock-wise direction, returns a new matrix.
	 * `degreeX` determines how much rate of y will be added to x.
	 * `degreeY` determines how much rate of x will be added to y.
	 */
	skewInDegree(degreeX: number, degreeY: number = degreeX): Matrix {
		return this.skew(MathUtils.degreeToRadians(degreeX), MathUtils.degreeToRadians(degreeY))
	}

	/** 
	 * Skew by angle in degree, in clock-wise direction.
	 * `degreeX` determines how much rate of y will be added to x.
	 * `degreeY` determines how much rate of x will be added to y.
	 */
	skewInDegreeSelf(degreeX: number, degreeY: number = degreeX): Matrix {
		return this.skewSelf(MathUtils.degreeToRadians(degreeX), MathUtils.degreeToRadians(degreeY))
	}

	/** 
	 * Skew by angle in radians, in clock-wise direction, returns a new matrix.
	 * `radiansX` determines how much rate of y will be added to x.
	 * `radiansY` determines how much rate of x will be added to y.
	 */
	skew(radiansX: number, radiansY: number = radiansX): Matrix {
		return this.clone().skewSelf(radiansX, radiansY)
	}

	/** 
	 * Skew by angle in radians, in clock-wise direction.
	 * `radiansX` determines how much rate of y will be added to x.
	 * `radiansY` determines how much rate of x will be added to y.
	 */
	skewSelf(radiansX: number, radiansY: number = radiansX): Matrix {
		let tx = Math.tan(radiansX)
		let ty = Math.tan(radiansY)

		return this.preMultiplySelf({
			a: 1,
			b: ty,
			c: tx,
			d: 1,
			e: 0,
			f: 0,
		})
	}

	/** Convert to inverse matrix, returns a new matrix. */
	inverse(): Matrix {
		return this.clone().invertSelf()
	}

	/** Convert to inverse matrix. */
	invertSelf(): this {
		let {a, b, c, d, e, f} = this
		let m11 = d
		let m12 = -c
		let m13 = c * f - e * d
		let detValue = a * m11 + b * m12

		if (detValue === 0) {
			this.reset()
		}
		else {
			let detValueInvert = 1 / detValue
			this.a = m11 * detValueInvert
			this.b = -b * detValueInvert
			this.c = m12 * detValueInvert
			this.d = a * detValueInvert
			this.e = m13 * detValueInvert
			this.f = (e * b - a * f) * detValueInvert
		}

		return this
	}

	/** Transform a point to get a new one. */
	transformPoint(point: GetObserved<Coord>): Point {
		let {a, b, c, d, e, f} = this
		let {x, y} = point

		return new Point(
			a * x + c * y + e,
			b * x + d * y + f
		)
	}

	/** Transform a vector to get a new one. */
	transformVector(vector: GetObserved<Coord>): Vector {
		let {a, b, c, d} = this
		let {x, y} = vector

		return new Vector(
			a * x + c * y,
			b * x + d * y
		)
	}
	
	/** Transform a box to get a new one. */
	transformBox(box: GetObserved<BoxLike>): Box {
		let p1 = new Point(box.x, box.y).transformSelf(this)
		let p2 = new Point(box.x + box.width, box.y).transformSelf(this)
		let p3 = new Point(box.x, box.y + box.height).transformSelf(this)
		let p4 = new Point(box.x + box.width, box.y + box.height).transformSelf(this)
		
		return Box.fromCoords(p1, p2, p3, p4)!
	}

	/** Transform a size to get a new one. */
	transformSize(size: GetObserved<SizeLike>): Size {
		let {a, b, c, d} = this
		let {width, height} = size

		return new Size(a * width + c * height, b * width + d * height)
	}

	/** 
	 * Mix with another matrix and returns a new matrix.
	 * @param rate is the mix rate of `m`.
	 */
	mix(m: GetObserved<MatrixLike>, rate: number): Matrix {
		return this.clone().mixSelf(m, rate)
	}

	/** 
	 * Mix with another matrix to self.
	 * @param rate is the mix rate of `m`.
	 */
	mixSelf(m: GetObserved<MatrixLike>, rate: number): this {
		let selfRate = 1 - rate

		this.a = this.a * selfRate + m.a * rate
		this.b = this.b * selfRate + m.b * rate
		this.c = this.c * selfRate + m.c * rate
		this.d = this.d * selfRate + m.d * rate
		this.e = this.e * selfRate + m.e * rate
		this.f = this.f * selfRate + m.f * rate

		return this
	}

	/** Convert to `matrix(...)` format, can be used as CSS transform value. */
	toString(): string {
		let {a, b, c, d, e, f} = this
		return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`
	}

	/** Convert to JSON data. */
	toJSON(): MatrixLike {
		let {a, b, c, d, e, f} = this
		return {a, b, c, d, e, f}
	}
}

