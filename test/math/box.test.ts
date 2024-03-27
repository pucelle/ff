import {Direction, BoxDistances, Size, Box, LineSegment, Point} from '../../src/math'


describe('Test Box', () => {
	
	test('Box Static', () => {
		expect(Box.fromCoords({x: 0, y: 0}, {x: 10, y: 10})).toEqual(new Box(0, 0, 10, 10))
		expect(Box.fromUnion(new Box(0, 0, 10, 10), new Box(10, 10, 10, 10))).toEqual(new Box(0, 0, 20, 20))
	})

	test('Box properties', () => {
		let b = new Box(0, 0, 10, 10)
		expect(b.left).toEqual(0)
		expect(b.top).toEqual(0)
		expect(b.right).toEqual(10)
		expect(b.bottom).toEqual(10)
		expect(b.center).toEqual(new Point(5, 5))
		expect(b.centerX).toEqual(5)
		expect(b.centerY).toEqual(5)
		expect(b.topLeft).toEqual(new Point(0, 0))
		expect(b.topRight).toEqual(new Point(10, 0))
		expect(b.bottomLeft).toEqual(new Point(0, 10))
		expect(b.bottomRight).toEqual(new Point(10, 10))
		expect(b.area).toEqual(100)
		expect(b.empty).toEqual(false)

		expect(b.edges()).toEqual([
			LineSegment.fromPoints(b.topLeft, b.topRight),
			LineSegment.fromPoints(b.topRight, b.bottomRight),
			LineSegment.fromPoints(b.bottomRight, b.bottomLeft),
			LineSegment.fromPoints(b.bottomLeft, b.topLeft),
		])

		expect(b.size()).toEqual(new Size(10, 10))
		expect(b.paddingTo(new Box(1, 1, 8, 8))).toEqual(new BoxDistances(1))
		expect(b.union(new Box(1, 1, 10, 10))).toEqual(new Box(0, 0, 11, 11))
		expect(b.intersect(new Box(1, 1, 10, 10))).toEqual(new Box(1, 1, 9, 9))
		expect(b.difference(new Box(0, 1, 10, 10))).toEqual(new Box(0, 0, 10, 1))
		expect(b.unionAtHV(new Box(-1, -1, 12, 12), 'horizontal')).toEqual(new Box(-1, 0, 12, 10))
		expect(b.unionAtHV(new Box(-1, -1, 12, 12), 'vertical')).toEqual(new Box(0, -1, 10, 12))
		expect(b.unionAt(new Box(-1, -1, 12, 12), Direction.Top)).toEqual(new Box(0, -1, 10, 11))
		expect(b.unionAt(new Box(-1, -1, 12, 12), Direction.Left)).toEqual(new Box(-1, 0, 11, 10))
		expect(b.expand(1)).toEqual(new Box(-1, -1, 12, 12))
		expect(b.expandByBoxEdges(new BoxDistances(1))).toEqual(new Box(-1, -1, 12, 12))

		b.set(0, 0, 20, 20)
		expect(b.area).toEqual(400)

		b.copyFrom(new Box(0, 0, 30, 30))
		expect(b.area).toEqual(900)

		b.reset()
		expect(b.empty).toEqual(true)
	})
})