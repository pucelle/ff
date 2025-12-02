import {GetObserved} from 'lupos'
import {NumberUtils} from '../utils'
import {Vector} from './vector'
import {HVDirection, BoxOffsetKey} from './types'


/** All Direction enumerable values. */
export const enum DirectionValue {
	None = -1,
	Center = 0,
	Left = 1,
	Right = 2,
	Top = 3,
	Bottom = 4,
	TopLeft = 5,
	BottomRight = 6,
	TopRight = 7,
	BottomLeft = 8,
}


/** 
 * A direction represents one of 8 directions, and 2 additional:
 * `Direction.center` and `Direction.None`.
 */
export class Direction {

	static None = /*#__PURE__*/new Direction(DirectionValue.None)
	static Center = /*#__PURE__*/new Direction(DirectionValue.Center)
	static Left = /*#__PURE__*/new Direction(DirectionValue.Left)
	static Right = /*#__PURE__*/new Direction(DirectionValue.Right)
	static Top = /*#__PURE__*/new Direction(DirectionValue.Top)
	static Bottom = /*#__PURE__*/new Direction(DirectionValue.Bottom)
	static TopLeft = /*#__PURE__*/new Direction(DirectionValue.TopLeft)
	static BottomRight = /*#__PURE__*/new Direction(DirectionValue.BottomRight)
	static TopRight = /*#__PURE__*/new Direction(DirectionValue.TopRight)
	static BottomLeft = /*#__PURE__*/new Direction(DirectionValue.BottomLeft)

	/** 4 straight directions. */
	static get StraightDirections(): Direction[] { 
		return [
			Direction.Left,
			Direction.Right,
			Direction.Top,
			Direction.Bottom,
		]
	}

	/** 4 oblique directions. */
	static get ObliqueDirections(): Direction[] {
		return [
			Direction.TopLeft,
			Direction.BottomRight,
			Direction.TopRight,
			Direction.BottomLeft,
		]
	}

	/** Make direction from a vector. */
	static fromVector(vector: GetObserved<Vector>): Direction {

		// Avoid 1e-13 != 0.
		let x = NumberUtils.nearlyZero(vector.x)
		let y = NumberUtils.nearlyZero(vector.y)

		if (x < 0 && y < 0) {
			return Direction.TopLeft
		}
		else if (x < 0 && y > 0) {
			return Direction.BottomLeft
		}
		else if (x < 0 && y < 0) {
			return Direction.TopLeft
		}
		else if (x > 0 && y > 0) {
			return Direction.BottomRight
		}
		else if (x > 0 && y < 0) {
			return Direction.TopRight
		}
		else if (x < 0) {
			return Direction.Left
		}
		else if (x > 0) {
			return Direction.Right
		}
		else if (y < 0) {
			return Direction.Top
		}
		else if (y > 0) {
			return Direction.Bottom
		}
		else if (x === 0 && y === 0) {
			return Direction.Center
		}
		else {
			return Direction.None
		}
	}

	/** Make direction from a numeric direction value. */
	static fromValue(value: DirectionValue): Direction {
		return ValueToDirection[value]
	}

	/** Make direction from a box offset key. */
	static fromBoxOffsetKey(key: BoxOffsetKey): Direction {
		if (key === 'left') {
			return Direction.Left
		}
		else if (key === 'right') {
			return Direction.Right
		}
		else if (key === 'top') {
			return Direction.Top
		}
		else if (key === 'bottom') {
			return Direction.Bottom
		}
		else {
			return Direction.None
		}
	}

	/** Make a straight direction from a vector, choose dominate direction when it's oblique. */
	static straightFromVector(v: GetObserved<Vector>): Direction {
		let {x, y} = v
		let absX = Math.abs(v.x)
		let absY = Math.abs(v.y)

		if (x < 0 && absX >= absY) {
			return Direction.Left
		}
		else if (x > 0 && absX >= absY) {
			return Direction.Right
		}
		else if (y < 0 && absX <= absY) {
			return Direction.Top
		}
		else if (y > 0 && absX <= absY) {
			return Direction.Bottom
		}
		else if (x === 0 && y === 0) {
			return Direction.Center
		}
		else {
			return Direction.None
		}
	}

	
	readonly value: DirectionValue

	/** Never make new Direction instance by yourself after initialized! */
	constructor(value: DirectionValue) {
		this.value = value
	}

	/** Whether be horizontal direction. */
	get beHorizontal(): boolean {
		return this === Direction.Left || this === Direction.Right
	}

	/** Whether be vertical direction. */
	get beVertical(): boolean {
		return this === Direction.Top || this === Direction.Bottom
	}

	/** Whether be straight direction. */
	get beStraight(): boolean {
		return this === Direction.Top || this === Direction.Bottom
			|| this === Direction.Left || this === Direction.Right
	}

	/** Whether be oblique direction. */
	get beOblique(): boolean {
		return this === Direction.TopLeft || this === Direction.TopRight
			|| this === Direction.BottomLeft || this === Direction.BottomRight
	}

	/** 
	 * Get opposite direction of current.
	 * Both `None` and `Center` are the opposite of themselves.
	 */
	get opposite(): Direction {
		if (this === Direction.Center || this === Direction.None) {
			return this
		}

		// Opposite pairs: (1, 2), (3, 4)...
		if (this.value % 2 === 1) {
			return Direction.fromValue(this.value + 1)
		}
		else {
			return Direction.fromValue(this.value - 1)
		}
	}

	/** Get horizontal part from current direction. */
	get horizontal(): Direction {
		if (this === Direction.TopLeft) {
			return Direction.Left
		}
		else if (this === Direction.BottomRight) {
			return Direction.Right
		}
		else if (this === Direction.TopRight) {
			return Direction.Right
		}
		else if (this === Direction.BottomLeft) {
			return Direction.Left
		}
		else if (this.beHorizontal) {
			return this
		}
		else {
			return Direction.Center
		}
	}

	/** Get vertical part from current direction. */
	get vertical(): Direction {
		if (this === Direction.TopLeft) {
			return Direction.Top
		}
		else if (this === Direction.BottomRight) {
			return Direction.Bottom
		}
		else if (this === Direction.TopRight) {
			return Direction.Top
		}
		else if (this === Direction.BottomLeft) {
			return Direction.Bottom
		}
		else if (this.beVertical) {
			return this
		}
		else {
			return Direction.Center
		}
	}

	/** Get straight part, choose vertical part if oblique. */
	get straightPreferVertical(): Direction {
		if (this.beOblique) {
			return this.vertical
		}

		return this
	}

	/** Get straight part, choose horizontal part if oblique. */
	get straightPreferHorizontal(): Direction {
		if (this.beOblique) {
			return this.horizontal
		}

		return this
	}

	/** Get a direction, on horizontal it's the opposite of current direction. */
	get horizontalMirror(): Direction {
		if (this === Direction.Left) {
			return Direction.Right
		}
		else if (this === Direction.Right) {
			return Direction.Left
		}
		else if (this === Direction.TopLeft) {
			return Direction.TopRight
		}
		else if (this === Direction.TopRight) {
			return Direction.TopLeft
		}
		else if (this === Direction.BottomLeft) {
			return Direction.BottomRight
		}
		else if (this === Direction.BottomRight) {
			return Direction.BottomLeft
		}
		else {
			return this
		}
	}

	/** Get a direction, on vertical it's the opposite of current direction. */
	get verticalMirror(): Direction {
		if (this === Direction.Top) {
			return Direction.Bottom
		}
		else if (this === Direction.Bottom) {
			return Direction.Top
		}
		else if (this === Direction.TopLeft) {
			return Direction.BottomLeft
		}
		else if (this === Direction.BottomLeft) {
			return Direction.TopLeft
		}
		else if (this === Direction.TopRight) {
			return Direction.BottomRight
		}
		else if (this === Direction.BottomRight) {
			return Direction.TopRight
		}
		else {
			return this
		}
	}

	/** Get the direction after rotating 90° in clockwise. */
	get clockwisePerpendicular(): Direction {
		if (this === Direction.Left) {
			return Direction.Top
		}
		else if (this === Direction.Right) {
			return Direction.Bottom
		}
		else if (this === Direction.Top) {
			return Direction.Right
		}
		else if (this === Direction.Bottom) {
			return Direction.Left
		}
		else if (this === Direction.TopLeft) {
			return Direction.TopRight
		}
		else if (this === Direction.BottomLeft) {
			return Direction.TopLeft
		}
		else if (this === Direction.TopRight) {
			return Direction.BottomRight
		}
		else if (this === Direction.BottomRight) {
			return Direction.BottomLeft
		}
		else {
			return this
		}
	}

	/** Get the direction after rotating 90° in anti-clockwise. */
	get antiClockwisePerpendicular(): Direction {
		if (this === Direction.Left) {
			return Direction.Bottom
		}
		else if (this === Direction.Right) {
			return Direction.Top
		}
		else if (this === Direction.Top) {
			return Direction.Left
		}
		else if (this === Direction.Bottom) {
			return Direction.Right
		}
		else if (this === Direction.TopLeft) {
			return Direction.BottomLeft
		}
		else if (this === Direction.BottomLeft) {
			return Direction.BottomRight
		}
		else if (this === Direction.TopRight) {
			return Direction.TopLeft
		}
		else if (this === Direction.BottomRight) {
			return Direction.TopRight
		}
		else {
			return this
		}
	}

	/** Get the direction after rotating 45° in clockwise. */
	get clockwiseNext(): Direction {
		if (this === Direction.Left) {
			return Direction.TopLeft
		}
		else if (this === Direction.Right) {
			return Direction.BottomRight
		}
		else if (this === Direction.Top) {
			return Direction.TopRight
		}
		else if (this === Direction.Bottom) {
			return Direction.BottomLeft
		}
		else if (this === Direction.TopLeft) {
			return Direction.Top
		}
		else if (this === Direction.BottomLeft) {
			return Direction.Left
		}
		else if (this === Direction.TopRight) {
			return Direction.Right
		}
		else if (this === Direction.BottomRight) {
			return Direction.Bottom
		}
		else {
			return this
		}
	}

	/** Get the direction after rotating 45° in anti-clockwise. */
	get antiClockwiseNext(): Direction {
		if (this === Direction.Left) {
			return Direction.BottomLeft
		}
		else if (this === Direction.Right) {
			return Direction.TopRight
		}
		else if (this === Direction.Top) {
			return Direction.TopLeft
		}
		else if (this === Direction.Bottom) {
			return Direction.BottomRight
		}
		else if (this === Direction.TopLeft) {
			return Direction.Left
		}
		else if (this === Direction.BottomLeft) {
			return Direction.Bottom
		}
		else if (this === Direction.TopRight) {
			return Direction.Top
		}
		else if (this === Direction.BottomRight) {
			return Direction.Right
		}
		else {
			return this
		}
	}

	/** Get the direction after converting it's x and y vector values to positive. */
	get positive(): Direction {
		if (this === Direction.Left) {
			return Direction.Right
		}
		else if (this === Direction.Top) {
			return Direction.Bottom
		}
		else if (this === Direction.TopLeft) {
			return Direction.BottomRight
		}
		else if (this === Direction.BottomLeft) {
			return Direction.BottomRight
		}
		else if (this === Direction.TopRight) {
			return Direction.BottomRight
		}
		else {
			return this
		}
	}

	/** Get the direction after converting it's x and y vector values to negative. */
	get negative(): Direction {
		if (this === Direction.Right) {
			return Direction.Left
		}
		else if (this === Direction.Bottom) {
			return Direction.Top
		}
		else if (this === Direction.TopLeft) {
			return Direction.TopLeft
		}
		else if (this === Direction.BottomLeft) {
			return Direction.TopLeft
		}
		else if (this === Direction.TopRight) {
			return Direction.TopLeft
		}
		else {
			return this
		}
	}

	/** Get a horizontal or vertical direction that current direction represent. */
	get hvDirection(): HVDirection | null {
		if (this.beHorizontal) {
			return 'horizontal' 
		}
		else if (this.beVertical) {
			return 'vertical'
		}
		else {
			return null
		}
	}

	/** Convert current direction to vector, which x and y values are betweens `-1~1`. */
	toVector(): Vector {
		if (this === Direction.Left) {
			return new Vector(-1, 0)
		}
		else if (this === Direction.Right) {
			return new Vector(1, 0)
		}
		else if (this === Direction.Top) {
			return new Vector(0, -1)
		}
		else if (this === Direction.Bottom) {
			return new Vector(0, 1)
		}
		else if (this === Direction.TopLeft) {
			return new Vector(-1, -1)
		}
		else if (this === Direction.BottomRight) {
			return new Vector(1, 1)
		}
		else if (this === Direction.TopRight) {
			return new Vector(1, -1)
		}
		else if (this === Direction.BottomLeft) {
			return new Vector(-1, 1)
		}
		else if (this === Direction.Center) {
			return new Vector(0, 0)
		}
		else {
			return new Vector(NaN, NaN)
		}
	}

	/** Convert to anchor vector, x/y values are between `0~1`. */
	toAnchorVector(): Vector {
		let v = this.toVector()

		// -1~1 -> 0~1
		v.x = v.x / 2 + 0.5
		v.y = v.y / 2 + 0.5

		return v
	}

	/** Whether a direction perpendicular with current. */
	isPerpendicularWith(direction: Direction): boolean {
		return direction === this.clockwisePerpendicular
			|| direction === this.antiClockwisePerpendicular
	}

	/** Join direction vectors to make a new direction. */
	joinWith(direction: Direction): Direction {
		let v1 = this.toVector()
		let v2 = direction.toVector()
		let joint = v1.add(v2)

		return Direction.fromVector(joint)
	}

	/** 
	 * Join direction vectors, pick primary straight direction.
	 * Returns `Center` if no primary straight direction leading.
	 */
	joinToStraight(direction: Direction): Direction {
		let v1 = this.toVector()
		let v2 = direction.toVector()
		let joint = v1.add(v2)

		if (Math.abs(joint.x) > Math.abs(joint.y)) {
			joint.y = 0
		}
		else if (Math.abs(joint.x) < Math.abs(joint.y)) {
			joint.x = 0
		}
		else {
			joint.x = 0
			joint.y = 0
		}

		return Direction.fromVector(joint)
	}

	/** 
	 * Whether direction and current are the opposite.
	 * Both `None` and `Center` are the opposite of themselves.
	 */
	isOppositeOf(direction: Direction): boolean {
		return direction === this.opposite
	}

	/** 
	 * Whether direction and current are close with each other,
	 * Which also means: their vector dot product value `>0` or intersection angle `<90°`.
	 */
	isCloseTo(direction: Direction): boolean {
		let v1 = this.toVector()
		let v2 = direction.toVector()

		return v1.dot(v2) > 0
	}

	/** 
	 * Whether direction and current face with each other,
	 * Which also means: their vector dot product value `<0` or intersection angle `>90°`.
	 */
	isFaceTo(direction: Direction): boolean {
		let v1 = this.toVector()
		let v2 = direction.toVector()

		return v1.dot(v2) < 0
	}

	/** 
	 * Convert to a box offset key.
	 * Returns `null` if not be straight.
	 */
	toBoxOffsetKey(): BoxOffsetKey | null {
		if (this === Direction.Left) {
			return 'left'
		}
		else if (this === Direction.Right) {
			return 'right'
		}
		else if (this === Direction.Top) {
			return 'top'
		}
		else if (this === Direction.Bottom) {
			return 'bottom'
		}
		else {
			return null
		}
	}

	/** 
	 * Convert to one or two directional keys.
	 * Returns empty array for Center or None direction.
	 */
	toBoxOffsetKeys(): BoxOffsetKey[] {
		if (this === Direction.Left) {
			return ['left']
		}
		else if (this === Direction.Right) {
			return ['right']
		}
		else if (this === Direction.Top) {
			return ['top']
		}
		else if (this === Direction.Bottom) {
			return ['bottom']
		}
		else if (this === Direction.TopLeft) {
			return ['top', 'left']
		}
		else if (this === Direction.BottomLeft) {
			return ['bottom', 'left']
		}
		else if (this === Direction.TopRight) {
			return ['top', 'right']
		}
		else if (this === Direction.BottomRight) {
			return ['bottom', 'right']
		}
		else {
			return []
		}
	}

	/** Get css cursor style string from direction. */
	toCursorStyle(): 'ew-resize' | 'ns-resize' | 'nesw-resize' | 'nwse-resize' | '' {
		if (this.beHorizontal) {
			return 'ew-resize'
		}
		else if (this.beVertical) {
			return 'ns-resize'
		}
		else if (this === Direction.BottomLeft || this === Direction.TopRight) {
			return 'nesw-resize'
		}
		else if (this === Direction.BottomRight || this === Direction.TopLeft) {
			return 'nwse-resize'
		}
		else {
			return ''
		}
	}
}


/** Map from value to direction. */
const ValueToDirection: Record<DirectionValue, Direction> = /*#__PURE__*/(() => ({
	[DirectionValue.None]: Direction.None,
	[DirectionValue.Center]: Direction.Center,
	[DirectionValue.Left]: Direction.Left,
	[DirectionValue.Right]: Direction.Right,
	[DirectionValue.Top]: Direction.Top,
	[DirectionValue.Bottom]: Direction.Bottom,
	[DirectionValue.TopLeft]: Direction.TopLeft,
	[DirectionValue.BottomRight]: Direction.BottomRight,
	[DirectionValue.TopRight]: Direction.TopRight,
	[DirectionValue.BottomLeft]: Direction.BottomLeft,
}))()