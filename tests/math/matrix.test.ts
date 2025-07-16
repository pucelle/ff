import {Point, Vector, Box, Matrix, Size, NumberUtils} from '../../src'


describe('Test Matrix', () => {

	test('Matrix Static', () => {
		expect(Matrix.fromString('matrix(1, 0, 0, 1, 1, 1)')).toEqual(new Matrix(1, 0, 0, 1, 1, 1))
		expect(Matrix.fromBoxPair(new Box(-1, -1, 2, 2), new Box(-1, -1, 4, 4))).toEqual(new Matrix(2, 0, 0, 2, 1, 1))
		expect(Matrix.fitBoxPair(new Box(-1, -1, 2, 2), new Box(-1, -3, 4, 8), 'contain')).toEqual(new Matrix(2, 0, 0, 2, 1, 1))
		expect(Matrix.fitBoxPair(new Box(-1, -1, 2, 2), new Box(-1, -3, 4, 8), 'cover')).toEqual(new Matrix(4, 0, 0, 4, 1, 1))
		expect(Matrix.zero()).toEqual(new Matrix(0, 0, 0, 0, 0, 0))
		expect(Matrix.i()).toEqual(new Matrix(1, 0, 0, 1, 0, 0))

		let v = new Vector(1, 1)
		let v1 = new Vector(1, 2)
		let v2 = new Vector(2, 1)
		
		expect(Matrix.decompressFactor(v, v1, v2)).toEqual(new Vector(1/3, 1/3))
		expect(Matrix.decompress(v, v1, v2)).toEqual([new Vector(1/3, 2/3), new Vector(2/3, 1/3)])

		expect(Matrix.makeNonSkewMatrixFromPoints(
			[new Point(-1, 0), new Point(1, 0)],
			[new Point(-1, 0), new Point(1, 0)]
		).equals(Matrix.i())).toEqual(true)

		expect(Matrix.makeNonSkewMatrixFromPoints(
			[new Point(-1, 0), new Point(1, 0)],
			[new Point(0, 0), new Point(2, 0)]
		)).toEqual(new Matrix(1, 0, -0, 1, 1, 0))

		expect(Matrix.makeNonSkewMatrixFromPoints(
			[new Point(-1, 0), new Point(1, 0)],
			[new Point(1, 0), new Point(-1, 0)]
		)).toEqual(new Matrix(-1, -0, 0, -1, 0, 0))

		expect(Matrix.makeNonSkewMatrixFromPoints(
			[new Point(-1, 0), new Point(1, 0)],
			[new Point(0, -2), new Point(0, 2)]
		)).toEqual(new Matrix(-0, 2, -2, -0, 0, 0))

		expect(Matrix.makeNonRotationMatrixFromPoints(
			[new Point(-1, 0), new Point(1, 0)],
			[new Point(0, -2), new Point(0, 2)]
		)).toEqual(new Matrix(2, 0, 0, 2, 0, 0))
	})


	test('Matrix', () => {
		let m = Matrix.zero()
		let m1 = new Matrix(2, 0, 0, 2, 0, 0)
		let m2 = new Matrix(1, 0, 0, 1, 2, 2)

		expect(m).toEqual(new Matrix(0, 0, 0, 0, 0, 0))

		m.set(1, 2, 3, 4, 5, 6)
		expect(m).toEqual(new Matrix(1, 2, 3, 4, 5, 6))

		m.reset()
		expect(m).toEqual(Matrix.i())

		m.copyFrom(new Matrix(1, 2, 3, 4, 5, 6))
		expect(m).toEqual(new Matrix(1, 2, 3, 4, 5, 6))

		expect(m.clone()).toEqual(m)
		expect(m.equals(m)).toEqual(true)

		m.reset()
		expect(m.isI()).toEqual(true)

		m.set(2, 0, 0, 2, 1, 1)
		expect(m.isI()).toEqual(false)

		m.reset()
		expect(m.isZero()).toEqual(false)

		m.set(0, 0, 0, 0, 0, 0)
		expect(m.isZero()).toEqual(true)

		m.reset()
		expect(m.getDeterminant()).toEqual(1)

		m.reset()
		expect(m.getEigenValues()).toEqual([1, 1])

		m.reset()
		expect(m.getPrimaryScaling()).toEqual(1)

		m.reset()
		expect(m.getSecondaryScaling()).toEqual(1)

		m.reset()
		expect(m.isRigid()).toEqual(true)

		m.set(2, 0, 0, 2, 0, 0)
		expect(m.isRigid()).toEqual(false)

		m.reset()
		expect(m.isSimilar()).toEqual(true)

		m.set(2, 0, 0, 1, 0, 0)
		expect(m.isSimilar()).toEqual(false)

		m.reset()
		expect(m.isSkewed()).toEqual(false)

		m.set(2, 1, 0, 1, 0, 0)
		expect(m.isSkewed()).toEqual(true)

		m.reset()
		expect(m.isMirrored()).toEqual(false)

		m.set(-1, 0, 0, 1, 0, 0)
		expect(m.isMirrored()).toEqual(true)

		expect(m1.multiply(m2)).toEqual(new Matrix(2, 0, 0, 2, 4, 4))
		expect(m1.multiplyScalar(2)).toEqual(new Matrix(4, 0, 0, 4, 0, 0))
		expect(m1.preMultiply(m2)).toEqual(new Matrix(2, 0, 0, 2, 2, 2))

		m.reset()
		expect(m.translate(1, 1)).toEqual(new Matrix(1, 0, 0, 1, 1, 1))

		m.reset()
		expect(m.translateBy({x:1, y:1})).toEqual(new Matrix(1, 0, 0, 1, 1, 1))

		m.reset()
		expect(m.scale(2, 2)).toEqual(new Matrix(2, 0, 0, 2, 0, 0))

		m.reset()
		m.rotateInDegreeSelf(90)
		m.a = NumberUtils.toDecimal(m.a, 8)
		m.d = NumberUtils.toDecimal(m.d, 8)
		expect(m).toEqual(new Matrix(0, 1, -1, 0, 0, 0))

		m.reset()
		m.rotateSelf(Math.PI)
		m.b = NumberUtils.toDecimal(m.b, 8)
		m.c = NumberUtils.toDecimal(m.c, 8)
		expect(m).toEqual(new Matrix(-1, 0, -0, -1, 0, 0))

		m.reset()
		m.skewInDegreeSelf(30)
		expect(m).toEqual(new Matrix(1, 0.5773502691896257, 0.5773502691896257, 1, 0, 0))

		m.reset()
		m.skewSelf(Math.PI / 6)
		expect(m).toEqual(new Matrix(1, 0.5773502691896257, 0.5773502691896257, 1, 0, 0))

		m.reset()
		expect(m.inverse().equals(m)).toEqual(true)

		m.set(2, 0, 0, 2, 0, 0)
		expect(m.inverse()).toEqual(new Matrix(0.5, -0, -0, 0.5, 0, 0))

		m.set(1, 0, 0, 1, 1, 1)
		expect(m.inverse()).toEqual(new Matrix(1, -0, -0, 1, -1, -1))

		m.set(1, 0, 0, 1, 1, 1)
		expect(m.transformPoint(new Point(1, 1))).toEqual(new Point(2, 2))

		m.set(1, 0, 0, 1, 1, 1)
		expect(m.transformVector(new Vector(1, 1))).toEqual(new Vector(1, 1))

		m.set(2, 0, 0, 2, 1, 1)
		expect(m.transformBox(new Box(0, 0, 1, 1))).toEqual(new Box(1, 1, 2, 2))

		m.set(2, 0, 0, 2, 1, 1)
		expect(m.transformSize(new Size(1, 1))).toEqual(new Size(2, 2))

		m.reset()
		expect(m.mix(new Matrix(1, 2, 3, 4, 5, 6), 0.5)).toEqual(new Matrix(1, 1, 1.5, 2.5, 2.5, 3))

		expect(new Matrix(1, 2, 3, 4, 5, 6).toString()).toEqual(`matrix(1, 2, 3, 4, 5, 6)`)
		expect(new Matrix(1, 2, 3, 4, 5, 6).mix(Matrix.i(), 0.5)).toEqual(new Matrix(1, 1, 1.5, 2.5, 2.5, 3))
		expect(new Matrix(1, 2, 3, 4, 5, 6).toJSON()).toEqual(new Matrix(1, 2, 3, 4, 5, 6))
	})
})