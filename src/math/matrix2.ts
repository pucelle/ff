import {MathUtils} from './math-utils'
import {Point} from './point'
import {Vector} from './vector'


/** 
 * Represents a 2x2 Matrix.
 * It's nearly equals a Matrix without translate,
 * But more convinent when doing some calculations like inversing.
 */
export class Matrix2 {

	/** 2x2 identity matrix. */
	static I() {
		return new Matrix2()
	}

	/** 2x2 zero matrix. */
	static zero(): Matrix2 {
		return new Matrix2(0, 0, 0, 0)
	}

	/** Create 2x2 matrix from 2 Coord. */
	static fromCoords(c1: Coord, c2: Coord) {
		return new Matrix2(
			c1.x, c2.x,
			c1.y, c2.y,
		)
	}
	
	/** Data array in column-major order. */
	data!: number[]

	/** Data arguments in row-major order. */
	constructor(
		n11: number = 1, n12: number = 0,
		n21: number = 0, n22: number = 1
	) {
		this.set(
			n11, n12,
			n21, n22,
		)
	}

	/** Set data array, based on row-major order. */
	protected set(
		n11: number, n12: number,
		n21: number, n22: number,
	) {
		this.data = [
			n11, n21,
			n12, n22,
		]
	}

	/** Reset data to I. */
	reset() {
		for (let i = 0; i < 4; i++) {
			if (i % 3 === 0) {
				this.data[i] = 1
			}
			else {
				this.data[i] = 0
			}
		}
	}

	/** Clone current matrix. */
	clone(): Matrix2 {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		return new Matrix2(
			n11, n12,
			n21, n22
		)
	}

	/** Copy values from a Matrix2 to current. */
	copyFrom(m: Matrix2): this {
		this.data[0] = m.data[0]
		this.data[1] = m.data[1]
		this.data[2] = m.data[2]
		this.data[3] = m.data[3]

		return this
	}

	/** Whether equals to another matrix. */
	equals(m: Matrix2): boolean {
		return this.data[0] === m.data[0]
			&& this.data[1] === m.data[1]
			&& this.data[2] === m.data[2]
			&& this.data[3] === m.data[3]
	}

	/** Returns data in row-major order. */
	flatten(): [number, number, number, number] {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		return [
			n11, n12,
			n21, n22,
		]
	}

	/** Returns a new transpose matrix from current matrix. */
	transpose(): Matrix2 {
		return this.clone().transposeSelf()
	}

	/** Set current matrix as transpose matrix of original. */
	transposeSelf(): this {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		this.set(
			n11, n21,
			n12, n22,
		)

		return this
	}

	/** Add another matrix and returns new result. */
	add(matrix: Matrix2): Matrix2 {
		return this.clone().addSelf(matrix)
	}

	/** Add another matrix to self. */
	addSelf(matrix: Matrix2): this {
		let [
			r11, r21,
			r12, r22,
		] = matrix.data

		this.data[0] += r11
		this.data[1] += r21
		this.data[2] += r12
		this.data[3] += r22

		return this
	}

	/** Minus another matrix and returns new result. */
	sub(matrix: Matrix2): Matrix2 {
		return this.clone().subSelf(matrix)
	}

	/** Minus another matrix from self. */
	subSelf(matrix: Matrix2): this {
		let [
			r11, r21,
			r12, r22,
		] = matrix.data

		this.data[0] -= r11
		this.data[1] -= r12
		this.data[2] -= r21
		this.data[3] -= r22

		return this
	}

	/** Multiply scalar and returns new result. */
	multiplyScalar(scale: number): Matrix2 {
		return this.clone().multiplyScalarSelf(scale)
	}

	/** Multiply scalar to self. */
	multiplyScalarSelf(scale: number): this {
		this.data[0] *= scale
		this.data[1] *= scale
		this.data[2] *= scale
		this.data[3] *= scale

		return this
	}

	/** Multiply another matrix and returns new result. */
	multiply(matrix: Matrix2): Matrix2 {
		return this.clone().multiplySelf(matrix)
	}

	/** Multiply another matrix to self. */
	multiplySelf(matrix: Matrix2): this {
		let [
			l11, l21,
			l12, l22,
		] = this.data

		let [
			r11, r21,
			r12, r22,
		] = matrix.data

		this.set(
			l11 * r11 + l12 * r21,
			l11 * r12 + l12 * r22,

			l21 * r11 + l22 * r21,
			l21 * r12 + l22 * r22,
		)

		return this
	}

	/** Get a new inverse matrix from current. */
	inverse(): Matrix2 {
		return this.clone().inverseSelf()
	}

	/** Apply inverse matrix to self. */
	inverseSelf(): this {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		let detValue = n11 * n22 - n12 * n21
		if (detValue === 0) {
			this.set(0, 0, 0, 0)
		}
		else {
			let detValueInvert = 1 / detValue

			// Algebraic Complement Transpose Matrix.
			this.set(
				 n22 * detValueInvert, -n12 * detValueInvert,
				-n21 * detValueInvert,  n11 * detValueInvert
			)
		}

		return this
	}

	/** Get determinant value of current matrix. */
	getDeterminant(): number {
		let [
			n11, n21,
			n12, n22,
		] = this.data
		
		return n11 * n22 - n12 * n21
	}
	/** Get matrix eigen values. */
	getEigenValues(): [number, number] {
		let [a, b, c, d] = this.data
		let det = a * d - b * c
		let pad = a + d

		return MathUtils.solveOneVariableQuadraticEquation(1, -pad, det) || [0, 0]
	}

	/** Multiply matrix to a Vector and returns the result. */
	transferVector(v: Vector): Vector {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		let {x, y} = v

		return new Vector(
			n11 * x + n12 * y,
			n21 * x + n22 * y,
		)
	}

	/** Multiply matrix to a Point and returns the result. */
	transferPoint(p: Point): Point {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		let {x, y} = p

		return new Point(
			n11 * x + n12 * y,
			n21 * x + n22 * y,
		)
	}

	/** Print matrix in console table format. */
	print() {
		let [
			n11, n21,
			n12, n22,
		] = this.data

		console.table([
			[n11, n12],
			[n21, n22],
		])
	}
}

