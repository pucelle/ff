import {MathUtils, NumberUtils} from '../../src'


describe('Test MathUtils', () => {

	test('MathUtils', () => {
		expect(MathUtils.degreeToRadians(90)).toEqual(Math.PI / 2)
		expect(MathUtils.radiansToDegree(Math.PI / 2)).toEqual(90)
		expect(NumberUtils.toDecimal(MathUtils.mix(1, 2, 0.2), 8)).toEqual(1.2)
		expect(NumberUtils.toDecimal(MathUtils.linearInterpolate(1.2, 1, 2), 8)).toEqual(0.2)

		expect(NumberUtils.toDecimal(MathUtils.linearStep(1.2, 1, 2), 8)).toEqual(0.2)
		expect(MathUtils.linearStep(0.1, 1, 2)).toEqual(0)
		expect(MathUtils.linearStep(3, 1, 2)).toEqual(1)

		expect(MathUtils.solveOneVariableQuadraticEquation(1, 2, 1)).toEqual([-1, -1])
		expect(MathUtils.solveOneVariableQuadraticEquation(1, 0, -1)).toEqual([-1, 1])
		expect(MathUtils.solveOneVariableQuadraticEquation(1, 0, 1)).toEqual(null)

		expect(MathUtils.pickPeriodicValuesInRange(0.1, 1, 0, 2)).toEqual([0.1, 1.1])
		expect(MathUtils.pickClosestPeriodicValueInRange(0.1, 1, 0, 2)).toEqual(0.1)
	})
})