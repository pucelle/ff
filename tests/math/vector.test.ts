import {Vector, NumberUtils} from '../../src'


describe('Test Vector', () => {

	test('Vector Static', () => {
		expect(Vector.Zero).toEqual(new Vector())
		expect(Vector.from({x: 1, y: 1})).toEqual(new Vector(1, 1))

		let p = Vector.fromDegree(90)
		p.x = NumberUtils.toDecimal(p.x, 8)
		expect(p).toEqual(new Vector(0, 1))

		p = Vector.fromRadians(Math.PI / 2)
		p.x = NumberUtils.toDecimal(p.x, 8)
		expect(p).toEqual(new Vector(0, 1))
	})


	test('Vector', () => {
		let v = new Vector()

		v.set(1, 1)
		expect(v).toEqual(new Vector(1, 1))

		v.reset()
		expect(v).toEqual(new Vector(0, 0))

		v.copyFrom(new Vector(1, 1))
		expect(v).toEqual(new Vector(1, 1))

		v.set(1, 1)
		expect(v.clone()).toEqual(new Vector(1, 1))

		v.set(1, 1)
		expect(v.equals(new Vector(1, 1))).toEqual(true)

		v.set(1, 1)
		expect(v.isZero()).toEqual(false)

		v.set(1, 1)
		expect(v.angleInDegree()).toEqual(45)

		v.set(1, 1)
		expect(v.angle()).toEqual(Math.PI / 4)

		v.set(1, 1)
		expect(v.getLengthSquare()).toEqual(2)

		v.set(1, 1)
		expect(v.getLength()).toEqual(Math.sqrt(2))

		v.set(1, 1)
		expect(v.add(new Vector(1, 1))).toEqual(new Vector(2, 2))

		v.set(1, 1)
		expect(v.sub(new Vector(1, 1))).toEqual(new Vector(0, 0))

		v.set(1, 1)
		expect(v.multiplyScalar(2)).toEqual(new Vector(2, 2))

		v.set(1, 1)
		expect(v.divideScalar(2)).toEqual(new Vector(0.5, 0.5))

		v.set(1, 1)
		expect(v.negative()).toEqual(new Vector(-1, -1))

		v.set(1, 1)
		v = v.rotate(Math.PI / 2)
		v.x = NumberUtils.toDecimal(v.x, 8)
		expect(v).toEqual(new Vector(-1, 1))

		v.set(1, 1)
		v = v.rotateInDegree(90)
		v.x = NumberUtils.toDecimal(v.x, 8)
		expect(v).toEqual(new Vector(-1, 1))

		v.set(1, 1)
		expect(v.normalize()).toEqual(new Vector(0.7071067811865475, 0.7071067811865475))

		v.set(1, 1)
		expect(v.mix(new Vector(2, 2), 0.5)).toEqual(new Vector(1.5, 1.5))

		v.set(1, 1)
		expect(v.toJSON()).toEqual({x: 1, y: 1})

		let v1 = new Vector(1, 2)
		let v2 = new Vector(2, 1)

		expect(v1.multiply(v2)).toEqual(new Vector(2, 2))
		expect(v1.complexMultiply(v2)).toEqual(new Vector(0, 5))

		expect(v1.divide(v2)).toEqual(new Vector(0.5, 2))
		expect(v1.complexDivide(v2)).toEqual(new Vector(0.8, 0.6))

		expect(v1.getRotateAngleFrom(v2)).toEqual(0.6435011087932843)
		expect(v2.getRotateAngleFrom(v1)).toEqual(-0.6435011087932843)

		expect(v1.getRotateAngleInDegreeFrom(v2)).toEqual(36.86989764584401)
		expect(v2.getRotateAngleInDegreeFrom(v1)).toEqual(-36.86989764584401)

		expect(v1.dot(v2)).toEqual(4)
		expect(v1.cross(v2)).toEqual(-3)
		expect(v2.cross(v1)).toEqual(3)

		expect(v1.projectTo(v2)).toEqual(new Vector(1.6, 0.8))

		let temp = v1.restAfterProjectTo(v2)
		temp.x = NumberUtils.toDecimal(temp.x, 8)
		temp.y = NumberUtils.toDecimal(temp.y, 8)
		expect(temp).toEqual(new Vector(-0.6, 1.2))

		temp = v1.backProjectFrom(v2)
		temp.x = NumberUtils.toDecimal(temp.x, 8)
		temp.y = NumberUtils.toDecimal(temp.y, 8)
		expect(temp).toEqual(new Vector(2.5, 1.25))

		v.set(1, 1)
		expect(v.decompressFactor(v1, v2)).toEqual(new Vector(1/3, 1/3))
		expect(v.decompress(v1, v2)).toEqual([new Vector(1/3, 2/3), new Vector(2/3, 1/3)])
	})
})