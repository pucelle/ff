import {ListUtils} from '../utils'
import {Direction} from './direction'
import {Inset} from './inset'
import {LineSegment} from './line-segment'
import {Point} from './point'
import {Size} from './size'
import {Vector} from './vector'
import type {Matrix} from './matrix'
import {MethodsToObserve, ToObserve} from '@pucelle/lupos'


/** Represent a rectangle bounding box. */
export class Box implements BoxLike, MethodsToObserve<
	'isIntersectWith' | 'isIntersectWithAtHV' | 'round' | 'ceil' | 'floor' | 'equals' | 'edges' | 'size' | 'paddingTo'
		| 'union' | 'intersect' | 'intersectAtHV' | 'difference' | 'unionAtHV' | 'unionAt' | 'expand'
		| 'expandByInset' | 'expandToContain' | 'translate' | 'translateBy' | 'transform'
		| 'anchorPointAt' | 'anchorPointByVector' | 'containsPoint' | 'containsPointAfterExpanded'
		| 'containsBox' | 'getCornerPoints' | 'minDistancedVectorToPoint' | 'minDistancedDirectionToBox'
		| 'minDistancedVectorToBox' | 'minBouncedVectorToPoint' | 'minBouncedDirectionToBox'
		| 'minBouncedVectorToBox' | 'distanceToPoint' | 'distanceToBox' | 'toJSON',
	'set' | 'reset' | 'copyFrom' | 'roundSelf' | 'ceilSelf' | 'floorSelf' | 'unionSelf'
		| 'intersectSelf' | 'intersectAtHVSelf' | 'differenceSelf' | 'unionAtHVSelf' | 'unionAtSelf' | 'expandSelf'
		| 'expandByInsetSelf' | 'expandToContainSelf' | 'translateSelf' | 'translateBySelf'
		| 'transformSelf'
>  {

	/** Empty box. */
	static empty(): Box {
		return new Box(0, 0, 0, 0)
	}

	/** Make box from `BoxLike`, such as `DOMRect`. */
	static fromLike(like: ToObserve<BoxLike>) {
		return new Box(like.x, like.y, like.width, like.height)
	}

	/** Make box from a point array. */
	static fromCoords(...coords: ToObserve<Coord>[]): Box | null{
		if (coords.length === 0) {
			return null
		}

		let left = coords[0].x
		let top = coords[0].y
		let right = coords[0].x
		let bottom = coords[0].y

		for (let i = 1; i < coords.length; i++) {
			let point = coords[i]

			left = Math.min(left, point.x)
			top = Math.min(top, point.y)
			right = Math.max(right, point.x)
			bottom = Math.max(bottom, point.y)
		}

		return new Box(left, top, right - left, bottom - top)
	}

	/** Make a box from a list of boxes. */
	static fromUnion(...boxes: ToObserve<Box>[]): Box | null {
		if (boxes.length === 0) {
			return null
		}

		let left = boxes[0].x
		let top = boxes[0].y
		let right = boxes[0].right
		let bottom = boxes[0].bottom

		for (let i = 1; i < boxes.length; i++) {
			let box = boxes[i]
			left = Math.min(left, box.left)
			top = Math.min(top, box.top)
			right = Math.max(right, box.right)
			bottom = Math.max(bottom, box.bottom)
		}

		return new Box(left, top, right - left, bottom - top)
	}

	
	x: number
	y: number
	width: number
	height: number

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}

	get left(): number {
		return this.x
	}

	get top(): number {
		return this.y
	}

	get right(): number {
		return this.x + this.width
	}

	get bottom(): number {
		return this.y + this.height
	}

	get center(): Point {
		return new Point(this.x + this.width / 2, this.y + this.height / 2)
	}

	get centerX(): number {
		return this.x + this.width / 2
	}

	get centerY(): number {
		return this.y + this.height / 2
	}

	get topLeft(): Point {
		return new Point(this.left, this.top)
	}

	get topRight(): Point {
		return new Point(this.right, this.top)
	}

	get bottomLeft(): Point {
		return new Point(this.left, this.bottom)
	}

	get bottomRight(): Point {
		return new Point(this.right, this.bottom)
	}

	/** Get area value, equals `width * height`. */
	get area(): number {
		return this.width * this.height
	}

	/** Whether is empty and not have any space. */
	get empty(): boolean {
		return this.width <= 0 && this.height <= 0
	}

	/** Set box values. */
	set(x: number, y: number, width: number, height: number) {
		this.x = x
		this.y = y
		this.width = width
		this.height = height
	}

	/** Reset position and size values to become an empty box. */
	reset() {
		this.x = 0
		this.y = 0
		this.width = 0
		this.height = 0
	}

	/** Copy values from a box to current. */
	copyFrom(b: Box) {
		this.x = b.x
		this.y = b.y
		this.width = b.width
		this.height = b.height
	}

	/** Clone box, returns a new one. */
	clone(): Box {
		return new Box(this.x, this.y, this.width, this.height)
	}

	/** Whether intersect with another box. */
	isIntersectWith(b: ToObserve<Box>): boolean {
		let left = Math.max(this.left, b.left)
		let top = Math.max(this.top, b.top)
		let right = Math.min(this.right, b.right)
		let bottom = Math.min(this.bottom, b.bottom)

		return left < right && top < bottom
	}

	/** Whether intersect with another box at HV direction. */
	isIntersectWithAtHV(b: ToObserve<Box>, hv: HVDirection): boolean {
		if (hv === 'horizontal') {
			let left = Math.max(this.left, b.left)
			let right = Math.min(this.right, b.right)

			return left < right
		}
		else {
			let top = Math.max(this.top, b.top)
			let bottom = Math.min(this.bottom, b.bottom)

			return top < bottom
		}
	}

	/** Round both position and size, returns a new box. */
	round(): Box {
		return this.clone().roundSelf()
	}

	/** Round both position and size. */
	roundSelf(): this {
		let {x: left, y: top, right, bottom} = this
		left = Math.round(left)
		top = Math.round(top)
		right = Math.round(right)
		bottom = Math.round(bottom)
		
		this.x = left
		this.y = top
		this.width = right - left
		this.height = bottom - top

		return this
	}

	/** Do Math Ceil to position and size, returns a new box. */
	ceil(): Box {
		return this.clone().ceilSelf()
	}

	/** Do Math Ceil to position and size. */
	ceilSelf(): this {
		let {x: left, y: top, right, bottom} = this
		left = Math.floor(left)
		top = Math.floor(top)
		right = Math.ceil(right)
		bottom = Math.ceil(bottom)
		
		this.x = left
		this.y = top
		this.width = right - left
		this.height = bottom - top

		return this
	}

	/** Do Math Floor to position and size, returns a new box. */
	floor(): Box {
		return this.clone().floorSelf()
	}

	/** Do Math Floor to position and size. */
	floorSelf(): this {
		let {x: left, y: top, right, bottom} = this
		left = Math.ceil(left)
		top = Math.ceil(top)
		right = Math.floor(right)
		bottom = Math.floor(bottom)
		
		this.x = left
		this.y = top
		this.width = right - left
		this.height = bottom - top

		return this
	}

	/** Whether equals another box. */
	equals(b: ToObserve<Box>): boolean {
		return this.x === b.x
			&& this.y === b.y
			&& this.width === b.width
			&& this.height === b.height
	}

	/** Get 4 edges of current box. */
	edges(): [LineSegment, LineSegment, LineSegment, LineSegment] {
		return [
			new LineSegment(this.topLeft, new Vector(this.width, 0)),
			new LineSegment(this.topRight, new Vector(0, this.height)),
			new LineSegment(this.bottomRight, new Vector(-this.width, 0)),
			new LineSegment(this.bottomLeft, new Vector(0, -this.height)),
		]
	}

	/** Get size of current box. */
	size(): Size {
		return Size.fromLike(this)
	}

	/** 
	 * Get the padding difference to another box,
	 * It nearly equals the margin values from current box to targeted box.
	 * If self is much bigger and fully contains targeted box,
	 * all values of returned object are positive.
	 */
	paddingTo(b: ToObserve<Box>): Inset {
		return new Inset(
			b.y - this.y,
			this.right - b.right,
			this.bottom - b.bottom,
			b.x - this.x,
		)
	}

	/** 
	 * Union with another box, returns a new box.
	 * Note only box has any space will be union with.
	 */
	union(b: ToObserve<Box>): Box {
		return this.clone().unionSelf(b)
	}

	/** 
	 * Union with another box.
	 * Note only box has any space will be union with.
	 */
	unionSelf(b: ToObserve<Box>): this {
		if (this.empty) {
			this.copyFrom(b)
		}
		else if (!b.empty) {
			let left = Math.min(this.x, b.x)
			let top = Math.min(this.y, b.y)
			let right = Math.max(this.right, b.right)
			let bottom = Math.max(this.bottom, b.bottom)
			
			this.x = left
			this.y = top
			this.width = right - left
			this.height = bottom - top
		}

		return this
	}

	/** Intersect with another box, returns a new box. */
	intersect(b: ToObserve<Box>): Box {
		return this.clone().intersectSelf(b)
	}

	/** Intersect with another box. */
	intersectSelf(b: ToObserve<Box>): this {
		let left = Math.max(this.x, b.x)
		let top = Math.max(this.y, b.y)
		let right = Math.min(this.right, b.right)
		let bottom = Math.min(this.bottom, b.bottom)

		this.x = left
		this.y = top
		this.width = Math.max(right - left, 0)
		this.height = Math.max(bottom - top, 0)

		return this
	}

	/** Difference to another box, exclude the part belong to `b`, returns a new box. */
	difference(b: ToObserve<Box>): Box {
		return this.clone().differenceSelf(b)
	}

	/** Difference to another box, exclude the part belong to `b`. */
	differenceSelf(b: ToObserve<Box>): this {
		let intersected = this.intersect(b)

		if (intersected.empty) {
			return this
		}
		
		if (intersected.equals(this)) {
			this.width = 0
			this.height = 0

			return this
		}

		if (intersected.width === this.width) {
			if (this.y === intersected.y) {
				let {bottom} = this
				this.y = intersected.bottom
				this.height = bottom - intersected.bottom
			}
			else if (this.bottom === intersected.bottom) {
				this.height = intersected.y - this.y
			}
		}

		else if (intersected.height === this.height) {
			if (this.x === intersected.x) {
				let {right} = this
				this.x = intersected.right
				this.width = right - intersected.right
			}
			else if (this.right === intersected.right) {
				this.width = intersected.x - this.x
			}
		}

		return this
	}

	/** Intersect with another box at horizontal or vertical direction, returns a new box. */
	intersectAtHV(b: ToObserve<Box>, hvDirection: HVDirection): Box {
		return this.clone().intersectAtHVSelf(b, hvDirection)
	}

	/** Intersect with another box at horizontal or vertical direction. */
	intersectAtHVSelf(b: ToObserve<Box>, hvDirection: HVDirection): this {
		if (hvDirection === 'horizontal') {
			let left = Math.max(this.x, b.x)
			let right = Math.min(this.right, b.right)

			this.x = left
			this.width = right - left
		}
		else {
			let top = Math.max(this.y, b.y)
			let bottom = Math.min(this.bottom, b.bottom)

			this.y = top
			this.height = bottom - top
		}

		return this
	}

	/** Union with another box at horizontal or vertical direction, returns a new box. */
	unionAtHV(b: ToObserve<Box>, hvDirection: HVDirection): Box {
		return this.clone().unionAtHVSelf(b, hvDirection)
	}

	/** Union with another box at horizontal or vertical direction. */
	unionAtHVSelf(b: ToObserve<Box>, hvDirection: HVDirection): this {
		if (hvDirection === 'horizontal') {
			let left = Math.min(this.x, b.x)
			let right = Math.max(this.right, b.right)

			this.x = left
			this.width = right - left
		}
		else {
			let top = Math.min(this.y, b.y)
			let bottom = Math.max(this.bottom, b.bottom)

			this.y = top
			this.height = bottom - top
		}

		return this
	}

	/** Intersect with another box, returns a new box. */
	unionAt(b: ToObserve<Box>, direction: Direction): Box {
		return this.clone().unionAtSelf(b, direction)
	}

	/** Union with another box, at horizontal or vertical direction. */
	unionAtSelf(b: ToObserve<Box>, direction: Direction): this {
		let {x: left, y: top, right, bottom} = this

		if (direction.isCloseTo(Direction.Left)) {
			left = Math.min(left, b.x)
		}
		else if (direction.isCloseTo(Direction.Right)) {
			right = Math.max(right, b.right)
		}

		if (direction.isCloseTo(Direction.Top)) {
			top = Math.min(top, b.y)
		}
		else if (direction.isCloseTo(Direction.Top)) {
			bottom = Math.max(bottom, b.bottom)
		}

		this.x = left
		this.y = top
		this.width = right - left
		this.height = bottom - top

		return this
	}

	/** Expand by pixels in 4 directions, returns a new box. */
	expand(top: number, right?: number, bottom?: number, left?: number): Box {
		return this.clone().expandSelf(top, right, bottom, left)
	}

	/** Expand by pixels in 4 directions. */
	expandSelf(top: number = 0, right: number = top, bottom: number = top, left: number = right): this {
		this.x = this.x - left
		this.y = this.y - top
		this.width = Math.max(this.width + right + left, 0)
		this.height = Math.max(this.height + top + bottom, 0)

		return this
	}

	/** Expand by a box edge distances object, returns a new box. */
	expandByInset(o: ToObserve<Inset>): Box {
		return this.clone().expandByInsetSelf(o)
	}

	/** Expand by a box edge distances object. */
	expandByInsetSelf(o: ToObserve<Inset>): Box {
		let {top, right, bottom, left} = o
		this.x = this.x - left
		this.y = this.y - top
		this.width = Math.max(this.width + right + left, 0)
		this.height = Math.max(this.height + top + bottom, 0)

		return this
	}

	/** Expand to contain a point, returns a new box. */
	expandToContain(p: ToObserve<Point>): Box {
		return this.clone().expandToContainSelf(p)
	}

	/** Expand to contain a point. */
	expandToContainSelf(p: ToObserve<Point>): this {
		let x = Math.min(this.x, p.x)
		let y = Math.min(this.y, p.y)
		let right = Math.max(this.right, p.x)
		let bottom = Math.max(this.bottom, p.y)

		this.x = x
		this.y = y
		this.width = right - x
		this.height = bottom - y

		return this
	}

	/** Do translate, returns a new box. */
	translate(x: number, y: number): Box {
		return this.clone().translateSelf(x, y)
	}

	/** Do translate to current. */
	translateSelf(x: number, y: number): this {
		this.x += x
		this.y += y

		return this
	}

	/** Do translate, returns a new box. */
	translateBy(vector: Coord): Box {
		return this.clone().translateBySelf(vector)
	}

	/** Do translate to current. */
	translateBySelf(vector: Coord): this {
		this.x += vector.x
		this.y += vector.y

		return this
	}

	/** Transform current box to get a new one. */
	transform(matrix: ToObserve<Matrix>): Box {
		return this.clone().transformSelf(matrix)
	}

	/** Transform current box. */
	transformSelf(matrix: ToObserve<Matrix>): this {
		let p1 = new Point(this.x, this.y).transformSelf(matrix)
		let p2 = new Point(this.right, this.y).transformSelf(matrix)
		let p3 = new Point(this.x, this.bottom).transformSelf(matrix)
		let p4 = new Point(this.right, this.bottom).transformSelf(matrix)
		
		let left = p1.x
		let top = p1.y
		let right = p1.x
		let bottom = p1.y

		for (let p of [p2, p3, p4]) {
			left = Math.min(left, p.x)
			top = Math.min(top, p.y)
			right = Math.max(right, p.x)
			bottom = Math.max(bottom, p.y)
		}

		this.x = left
		this.y = top
		this.width = right - left
		this.height = bottom - top

		return this
	}

	/** Get the anchor point from direction. */
	anchorPointAt(d: Direction): Point {
		let v = d.toAnchorVector()
		return this.anchorPointByVector(v)
	}

	/** Get the anchor point from an anchor vector, at which the x,y value betweens `0~1`. */
	anchorPointByVector(v: ToObserve<Vector>): Point {
		return new Point(this.x + v.x * this.width, this.y + v.y * this.height)
	}

	/** Whether contains a point. */
	containsPoint(p: ToObserve<Point>): boolean {
		return this.x <= p.x && this.right >= p.x
			&& this.y <= p.y && this.bottom >= p.y
	}

	/** Whether contains a point after expanded. */
	containsPointAfterExpanded(p: ToObserve<Point>, expand: number): boolean {
		return this.x - expand <= p.x && this.right + expand >= p.x
			&& this.y - expand <= p.y && this.bottom + expand >= p.y
	}

	/** Whether totally contains a box. */
	containsBox(b: ToObserve<Box>): boolean {
		return this.x <= b.x && this.right >= b.right
			&& this.y <= b.y && this.bottom >= b.bottom
	}

	/** Get 4 corner points. */
	getCornerPoints(): [Point, Point, Point, Point] {
		let {top, right, bottom, left} = this

		return [
			new Point(left, top),
			new Point(right, top),
			new Point(right, bottom),
			new Point(left, bottom),
		]
	}

	/** 
	 * Get the direction that represent the minimum distanced vector,
	 * that starts from current box and ends at targeted point,
	 * and follow which to move current box can make the point intersect with current box.
	 * If point is contained by current box, returns zero vector.
	 */
	minDistancedVectorToPoint(p: ToObserve<Point>): Vector {
		let isXIntersected = p.x >= this.left && p.x <= this.right
		let isYIntersected = p.y >= this.top && p.y <= this.bottom
		let xDistance = 0
		let yDistance = 0

		if (!isXIntersected) {
			xDistance = ListUtils.minOf([p.x - this.right, p.x - this.left], Math.abs)!
		}

		if (!isYIntersected) {
			yDistance = ListUtils.minOf([p.y - this.top, p.y - this.bottom], Math.abs)!
		}

		return new Vector(xDistance, yDistance)
	}

	/** 
	 * Get the direction that represent the minimum distanced vector,
	 * that starts from current box and ends at another box,
	 * and follow which to move current box can make two boxes intersect with each other.
	 * If boxes are intersected in both directions, returns `Direction.Center`.
	 */
	minDistancedDirectionToBox(b: ToObserve<Box>): Direction {
		let v = this.minDistancedVectorToBox(b)
		return Direction.fromVector(v)
	}
	
	/** 
	 * Get the minimum-length distanced vector,
	 * that starts from current box and ends at another box,
	 * and follow which to move current box can make two boxes intersect with each other.
	 * If boxes intersected in x/y direction, vector value of this direction is zero.
	 */
	minDistancedVectorToBox(b: ToObserve<Box>): Vector {
		if (this.isIntersectWith(b)) {
			return new Vector(0, 0)
		}

		let {left: left1, right: right1, top: top1, bottom: bottom1} = this
		let {left: left2, right: right2, top: top2, bottom: bottom2} = b
		let x = ListUtils.minOf([Math.max(right2 - left1, 0), Math.min(left2 - right1, 0)], Math.abs)!
		let y = ListUtils.minOf([Math.max(bottom2 - top1, 0), Math.min(top2 - bottom1, 0)], Math.abs)!

		return new Vector(x, y)
	}

	/** 
	 * Returns the minimum bounced out vector,
	 * that starts from current box and ends at targeted point,
	 * follow which to move current box can make the point not in box any more.
	 * If point is not contained by box, returns zero vector.
	 */
	minBouncedVectorToPoint(p: ToObserve<Point>): Vector {
		let isXIntersected = p.x >= this.left && p.x <= this.right
		let isYIntersected = p.y >= this.top && p.y <= this.bottom
		let xDistance = 0
		let yDistance = 0

		if (isXIntersected) {
			xDistance = ListUtils.minOf([p.x - this.left, p.x - this.right], Math.abs)!
		}

		if (isYIntersected) {
			yDistance = ListUtils.minOf([p.y - this.top, p.y - this.bottom], Math.abs)!
		}

		return new Vector(xDistance, yDistance)
	}

	/** 
	 * Get the direction of the minimum bounced out vector,
	 * that starts from current box and ends at targeted point,
	 * follow which to move current box can make the point not in box any more.
	 * If boxes are intersected in both directions, returns `Direction.Center`.
	 */
	minBouncedDirectionToBox(b: ToObserve<Box>): Direction {
		let v = this.minBouncedVectorToBox(b)
		return Direction.fromVector(v)
	}
	
	/** 
	 * Returns the minimum bounced out vector to a point,
	 * that starts from current box and ends at targeted point,
	 * follow which to move current box can make current box not intersected with another.
	 * If boxes are not intersected in x/y direction, vector value of this direction is zero.
	 */
	minBouncedVectorToBox(b: ToObserve<Box>): Vector {
		if (!this.isIntersectWith(b)) {
			return new Vector(0, 0)
		}

		let {left: left1, right: right1, top: top1, bottom: bottom1} = this
		let {left: left2, right: right2, top: top2, bottom: bottom2} = b
		let x = ListUtils.minOf([right2 - left1, left2 - right1], Math.abs)!
		let y = ListUtils.minOf([bottom2 - top1, top2 - bottom1], Math.abs)!

		return new Vector(x, y)
	}

	/** 
	 * Returns the minimum distance to a point,
	 * respect the length of the vector which starts from current box and ends at targeted point.
	 * Can be negative, box can move by this distance to make point out-of box.
	 */
	distanceToPoint(p: ToObserve<Point>): number {
		let isXIntersected = p.x >= this.left && p.x <= this.right
		let isYIntersected = p.y >= this.top && p.y <= this.bottom
		let xDistance = 0
		let yDistance = 0

		if (isXIntersected && isYIntersected) {
			xDistance = ListUtils.minOf([p.x - this.left, p.x - this.right], Math.abs)!
			yDistance = ListUtils.minOf([p.y - this.top, p.y - this.bottom], Math.abs)!

			return -Math.min(Math.abs(xDistance), Math.abs(yDistance))
		}
		else {
			if (!isXIntersected) {
				xDistance = ListUtils.minOf([p.x - this.right, p.x - this.left], Math.abs)!
			}
	
			if (!isYIntersected) {
				yDistance = ListUtils.minOf([p.y - this.top, p.y - this.bottom], Math.abs)!
			}

			return Math.min(Math.abs(xDistance), Math.abs(yDistance))
		}
	}

	/** 
	 * Get the minimum distance to a box,
	 * respect the length of the vector which starts from current box and ends at another box.
	 * Can be negative, current box can move by this distance to make boxes not intersected any more.
	 */
	distanceToBox(b: ToObserve<Box>): number {
		let {left: left1, right: right1, top: top1, bottom: bottom1} = this
		let {left: left2, right: right2, top: top2, bottom: bottom2} = b
		let x = ListUtils.minOf([right2 - left1, left2 - right1], Math.abs)!
		let y = ListUtils.minOf([bottom2 - top1, top2 - bottom1], Math.abs)!

		if (this.isIntersectWith(b)) {
			return -Math.min(Math.abs(x), Math.abs(y))
		}
		else {
			return Math.min(Math.abs(x), Math.abs(y))
		}
	}

	/** Convert to JSON data. */
	toJSON(): BoxLike {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height,
		}
	}
}
