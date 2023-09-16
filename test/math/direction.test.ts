import {Direction} from '../../src/math/direction'


describe('Test Direction', () => {

	// Most APIs of `Direction` are very simple, no need to test.
	test('opposite', () => {
		expect(Direction.Left.opposite).toEqual(Direction.Right)
		expect(Direction.Right.opposite).toEqual(Direction.Left)
		expect(Direction.Top.opposite).toEqual(Direction.Bottom)
		expect(Direction.Bottom.opposite).toEqual(Direction.Top)
		expect(Direction.TopLeft.opposite).toEqual(Direction.BottomRight)
		expect(Direction.BottomRight.opposite).toEqual(Direction.TopLeft)
		expect(Direction.TopRight.opposite).toEqual(Direction.BottomLeft)
		expect(Direction.BottomLeft.opposite).toEqual(Direction.TopRight)
		expect(Direction.Center.opposite).toEqual(Direction.Center)
		expect(Direction.None.opposite).toEqual(Direction.None)
	})
})