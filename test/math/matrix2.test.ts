import {Vector, Matrix2} from '../../src/math'


describe('Test Matrix2', () => {

	test('Matrix2 Static', () => {
		expect(Matrix2.I).toEqual(new Matrix2(1, 0, 0, 1))
		expect(Matrix2.i()).toEqual(new Matrix2(1, 0, 0, 1))
		expect(Matrix2.zero()).toEqual(new Matrix2(0, 0, 0, 0))
		expect(Matrix2.fromCoords(new Vector(1, 1), new Vector(2, 2))).toEqual(new Matrix2(1, 2, 1, 2))
	})


	test('Matrix2', () => {
		let m = Matrix2.zero()
		let m1 = new Matrix2(2, 0, 0, 2)
		let m2 = new Matrix2(1, 0, 0, 1)

		m.set(1, 2, 3, 4)
		expect(m).toEqual(new Matrix2(1, 2, 3, 4))

		m.reset()
		expect(m).toEqual(Matrix2.I)

		m.copyFrom(new Matrix2(1, 2, 3, 4))
		expect(m).toEqual(new Matrix2(1, 2, 3, 4))

		expect(m.clone()).toEqual(m)
		expect(m.equals(m)).toEqual(true)

		m.reset()
		expect(m.isI()).toEqual(true)

		m.set(2, 0, 0, 2)
		expect(m.isI()).toEqual(false)

		m.reset()
		expect(m.isZero()).toEqual(false)

		m.set(0, 0, 0, 0)
		expect(m.isZero()).toEqual(true)

		m.reset()
		expect(m.getDeterminant()).toEqual(1)

		m.reset()
		expect(m.getEigenValues()).toEqual([1, 1])

		expect(m1.multiply(m2)).toEqual(new Matrix2(2, 0, 0, 2))
		expect(m1.multiplyScalar(2)).toEqual(new Matrix2(4, 0, 0, 4))

		m.reset()
		expect(m.inverse().equals(m)).toEqual(true)

		m.set(2, 0, 0, 2)
		expect(m.inverse()).toEqual(new Matrix2(0.5, -0, -0, 0.5))

		m.set(1, 0, 0, 1)
		expect(m.inverse()).toEqual(new Matrix2(1, -0, -0, 1))

		m.set(1, 0, 0, 1)
		expect(m.transformVector(new Vector(1, 1))).toEqual(new Vector(1, 1))
	})
})