import {Direction} from '../math'
import {untilUpdateComplete} from '../tracking'
import {ObjectUtils, DOMUtils} from '../utils'


/** 
 * Options for AnchorAligner.
 */
export interface AnchorAlignerOptions {

	/** If specified, use this as css anchor name. */
	name: string

	/** 
	 * Align where of target to where of anchor.
	 * e.g., `tl-bl` means align top-left of content, to bottom-left of anchor
	 * First part, can be omitted, will pick opposite: `t-b` equals `b`, `tl-br` equals `br`.
	 */
	position: AnchorPosition

	/** 
	  * The gaps betweens anchor and target.
	  * It nearly equals expanding anchor area with this value.
	  * Can be a number or a number array composed of 1-4 numbers, in `top right? bottom? left?` order.
	  */
	gaps: number | number[]

	/** 
	  * The gaps betweens target and viewport edges.
	  * Can be a number or a number array composed of 1-4 numbers,
	  * in `top right? bottom? left?` order.
	  * Works only when `stickToEdges` set to `true`.
	  */
	edgeGaps: number | number[]

	/** 
	 * Whether stick target to viewport edges.
	 * Such that if target partly cut by viewport,
	 * it will be adjusted to stick viewport edges and become fully visible.
	 * Default value is `false`, set it to `true` to enable.
	 * Note sets it to `true` may cause additional render refreshing.
	 */
	stickToEdges: boolean

	/** 
	 * Whether can flip target position if available spaces in targeted position is not enough.
	 * If specifies as `auto`, and has one direction edges collapse, will choose this direction.
	 * Default value is `auto`, set it to `null` to disable flipping.
	 */
	flipDirection: HVDirection | 'auto' | null

	/** 
	 * The triangle element inside target,
	 * If provided, will adjust it's left or top position, and transform property,
	 * to anchor it to be in the center of the intersect edges between anchor and target.
	 * Note provides it to `true` may cause additional render refreshing.
	 */
	triangle?: HTMLElement

	/** 
	 * Whether triangle element in a fixed position.
	 * 
	 * Default value is `false`, means triangle element will be aligned to be
	 * in the center of the intersect edges between anchor and target.
	 * 
	 * If specified as `true`, e.g., triangle always locates at top-left corner.
	 * will use the position of the triangle acute angle to do alignment,
	 * instead of the target anchor point.
	 */
	fixedTriangle: boolean
}


/** Align which direction of target to which direction of anchor. */
export type AnchorPosition = AnchorPositionSingle
	| `${AnchorPositionSingle}-${AnchorPositionSingle}`

/** Single of anchor position. */
type AnchorPositionSingle = 't'
	| 'b'
	| 't'
	| 'l'
	| 'r'
	| 'c'

	| 'bl'
	| 'bc'
	| 'br'
	| 'tl'
	| 'tc'
	| 'tr'
	| 'cc'

	| 'lb'
	| 'lt'
	| 'rb'
	| 'rt'

/** 4 directions of gap. */
interface AnchorGaps {
	top: number
	right: number
	bottom: number
	left: number
}


const DefaultAnchorAlignerOptions: AnchorAlignerOptions = {
	name: '',
	position: 'b',
	gaps: 0,
	edgeGaps: 0,
	stickToEdges: true,
	flipDirection: 'auto',
	triangle: undefined,
	fixedTriangle: false,
}

export class AnchorAligner {
	
	/** 
	 * Get the direction that anchor face to target.
	 * Always get a straight direction.
	 */
	static getAnchorFaceDirection(position: AnchorPosition): Direction {
		let [d1, d2] = parseAlignDirections(position)
		return d2.joinToStraight(d1.opposite)
	}
	

	/** The target to align. */
	readonly target: HTMLElement

	/** Anchor to align besides. */
	readonly anchor: Element

	/** Full options. */
	private options: AnchorAlignerOptions = DefaultAnchorAlignerOptions

	/** Align directions of target and anchors. */
	private alignDirections!: [Direction, Direction]

	/**
	 * In which direction, and also the only direction
	 * the anchor face with target.
	 * This is always a straight direction.
	 * 
	 * E.g.:
	 *  - `tl-bl` -> `Bottom`.
	 *  - `c-c` -> `Center`.
	 */
	private anchorFaceDirection!: Direction

	/** Gaps betweens anchor and target. */
	private gaps!: AnchorGaps

	/** Gaps betweens target and viewport edges. */
	private edgeGaps!: AnchorGaps

	/** Whether target use fixed alignment position. */
	private targetInFixedAlignment: boolean = false

	/** 
	 * Whether in aligning.
	 * When in aligning, and need to, will keep syncing align position.
	 */
	private aligning: boolean = false

	constructor(target: HTMLElement, anchor: Element, options: Partial<AnchorAlignerOptions> = {}) {
		this.target = target
		this.anchor = anchor
		this.updateOptions(options)
	}

	/** 
	 * Get initialize by partial options.
	 * Returns whether options get changed.
	 */
	updateOptions(options: Partial<AnchorAlignerOptions> = {}): boolean {
		let newOptions = {...DefaultAnchorAlignerOptions, ...options}

		let changed = !ObjectUtils.deepEqual(this.options, newOptions)
		if (changed) {
			this.options = newOptions
		}

		this.alignDirections = parseAlignDirections(newOptions.position)
		this.anchorFaceDirection = this.alignDirections[1].joinToStraight(this.alignDirections[0].opposite)
		this.gaps = parseGaps(newOptions.gaps, newOptions.triangle, this.anchorFaceDirection)
		this.edgeGaps = parseGaps(newOptions.edgeGaps, newOptions.triangle, this.anchorFaceDirection)

		// If anchor is not affected by document scrolling, target should be the same.
		// A potential problem here: once becomes fixed, can't be restored for reuseable popups.
		if (findClosestFixedElement(this.anchor)) {
			this.target.style.position = 'fixed'
			this.targetInFixedAlignment = true
		}
		else {
			this.targetInFixedAlignment = getComputedStyle(this.target).position === 'fixed'
		}

		return changed
	}

	/** 
	 * Align content to beside anchor.
	 * Returns whether did alignment.
	 */
	async align(options: Partial<AnchorAlignerOptions> = {}): Promise<boolean> {

		// Wait for update complete, now can read dom properties.
		await untilUpdateComplete()

		let optionsChanged = this.updateOptions(options)
		let contentRect = this.target.getBoundingClientRect()
		let anchorRect = this.anchor.getBoundingClientRect()

		// Pick viewport for document element.
		if (this.anchor === document.documentElement) {
			anchorRect.x = 0
			anchorRect.y = 0
		}

		// Both rects have not changed.
		if (!optionsChanged
			&& this.cachedContentRect && isRectsEqual(this.cachedContentRect, contentRect)
			&& this.cachedAnchorRect && isRectsEqual(this.cachedAnchorRect, anchorRect)
		) {
			return true
		}

		// If anchor is not visible.
		if (anchorRect.width === 0 && anchorRect.height === 0) {
			return false
		}		

		return this.alignByRects(contentRect, anchorRect)
	}

	/** Align target to the position of a mouse event. */
	async alignToEvent(event: MouseEvent, options: Partial<AnchorAlignerOptions> = {}): Promise<boolean> {

		// Wait for update complete, now can read dom properties.
		await untilUpdateComplete()

		let optionsChanged = this.updateOptions(options)
		let contentRect = this.target.getBoundingClientRect()

		let anchorRect = new DOMRect(
			event.clientX,
			event.clientY,
			0,
			0
		)

		// Both rects have not changed.
		if (!optionsChanged
			&& this.cachedContentRect && isRectsEqual(this.cachedContentRect, contentRect)
			&& this.cachedAnchorRect && isRectsEqual(this.cachedAnchorRect, anchorRect)
		) {
			return true
		}

		return this.alignByRects(contentRect, anchorRect)
	}

	/** 
	 * Stop aligning.
	 * Note this will not hide 
	 */
	cancel() {

	}

	/** Align content after known both rects. */
	private async alignByRects(contentRect: DOMRect, anchorRect: DOMRect): Promise<boolean> {

		// Now can only read dom properties.
		let anchorFaceDirection = this.anchorFaceDirection
		let shouldResetContentHeight = this.alignmentState.haveShrinkOnY
		let shouldClearContentPosition = this.shouldClearContentPosition(contentRect)


		// Now can only write dom properties.

		// Reset styles before doing alignment.
		this.resetStyles()

		// Whether anchor in viewport.
		let anchorInViewport = DOMUtils.isRectIntersectWithViewport(anchorRect)
		let willAlign = anchorInViewport || !this.options.stickToEdges
		if (!willAlign) {
			return false
		}


		// Now can only read dom properties.

		// content may be shrunk into the edge and it's width get limited.
		// An additional write and read of dom properties.
		if (shouldResetContentHeight || shouldClearContentPosition) {
			this.clearContentPosition()
			contentRect = this.target.getBoundingClientRect()
		}

		// Read triangle rect based on content origin, must after resetting style.
		let triangleRelativeRect = this.getTriangleRelativeRect(contentRect)

		// Do content alignment.
		let alignResult = this.doAlignment(anchorFaceDirection, contentRect, anchorRect, triangleRelativeRect)
		anchorFaceDirection = alignResult.anchorFaceDirection
		this.alignmentState.haveShrinkOnY = alignResult.overflowOnY

		// Handle `triangle` position.
		if (this.options.triangle) {
			this.alignTriangle(anchorFaceDirection, contentRect, anchorRect, triangleRelativeRect!)
		}

		this.cachedContentRect = contentRect
		this.cachedAnchorRect = anchorRect

		return true
	}

	/** Set some styles of content and triangle element before doing alignment. */
	private resetStyles() {

		// Restore content original height.
		if (this.alignmentState.haveShrinkOnY) {
			this.target.style.height = ''
			this.alignmentState.haveShrinkOnY = false
		}

		// Restore triangle transform.
		if (this.options.triangle && this.alignmentState.triangleTransformed) {
			this.options.triangle.style.transform = ''
			this.alignmentState.triangleTransformed = false
		}
	}

	/** Should clear last alignment properties, to avoid it's position affect it's size. */
	private shouldClearContentPosition(contentRect: DOMRect) {

		// If rect of content close to window edge,
		// it's width may be limited by rendering system to stick to viewport edge.
		return contentRect.right >= document.documentElement.clientWidth
	}

	/** Clear last alignment properties. */
	private clearContentPosition() {
		this.target.style.left = '0'
		this.target.style.right = ''
		this.target.style.top = '0'
	}

	/** Get triangle rect based on target origin. */
	private getTriangleRelativeRect(contentRect: DOMRect): DOMRect | null {
		if (!this.options.triangle) {
			return null
		}

		let triangleRect = this.options.triangle.getBoundingClientRect()

		// Translate by content rect position to become relative.
		return new DOMRect(
			triangleRect.x - contentRect.x,
			triangleRect.y - contentRect.y,
			triangleRect.width,
			triangleRect.height
		)
	}

	/** 
	 * Do alignment from content to anchor for once.
	 * It outputs alignment position to `contentRect`.
	 */
	private doAlignment(anchorFaceDirection: Direction, contentRect: DOMRect, anchorRect: DOMRect, triangleRelativeRect: DOMRect | null) {
		let anchor1 = this.getContentRelativeAnchorPoint(anchorFaceDirection, contentRect, triangleRelativeRect)
		let anchor2 = this.getAnchorAbsoluteAnchorPoint(anchorRect)

		// Fixed target position.
		let position = {x: anchor2.x - anchor1.x, y: anchor2.y - anchor1.y}
		this.addGapToAlignPosition(position)

		// Handle vertical alignment.
		let alignResult = this.alignVertical(position.y, anchorFaceDirection, contentRect, anchorRect, triangleRelativeRect)
		let overflowOnY = alignResult.overflowOnY
		anchorFaceDirection = alignResult.anchorFaceDirection

		// If target's height changed.
		if (overflowOnY) {
			anchor1 = this.getContentRelativeAnchorPoint(anchorFaceDirection, contentRect, triangleRelativeRect)
			position = {x: anchor2.x - anchor1.x, y: anchor2.y - anchor1.y}
			this.addGapToAlignPosition(position)
		}

		// Handle horizontal alignment.
		anchorFaceDirection = this.alignHorizontal(position.x, anchorFaceDirection, contentRect, anchorRect, triangleRelativeRect)

		// The fixed position of content currently.
		let x = contentRect.x
		let y = contentRect.y

		// For absolute layout content, convert x, y to absolute position.
		if (!this.targetInFixedAlignment && this.anchor !== document.body && this.anchor !== document.documentElement) {
			var offsetParent = this.target.offsetParent as HTMLElement

			// If we use body's top position, it will cause a bug when body has a margin top (even from margin collapse).
			if (offsetParent) {
				var parentRect = offsetParent.getBoundingClientRect()
				x -= parentRect.left
				y -= parentRect.top
			}
		}

		// May scrollbar appears after alignment,
		// such that it should align to right.
		if (anchorFaceDirection === Direction.Left) {
			this.target.style.left = 'auto'
			this.target.style.right = document.documentElement.clientWidth - contentRect.right + 'px'
		}
		else {
			this.target.style.left = x + 'px'
			this.target.style.right = 'auto'
		}

		this.target.style.top = y + 'px'

		return {
			overflowOnY,
			anchorFaceDirection,
		}
	}

	/** Get relative anchor position in the origin of target. */
	private getContentRelativeAnchorPoint(anchorFaceDirection: Direction, contentRect: DOMRect, triangleRelativeRect: DOMRect | null): Coord {
		let point = {x: 0, y: 0}

		// Anchor at triangle position.
		if (this.options.fixedTriangle && triangleRelativeRect) {
			if (anchorFaceDirection.beVertical) {
				point.x = triangleRelativeRect.left + triangleRelativeRect.width / 2
			}
			else if (anchorFaceDirection.beHorizontal) {
				point.y = triangleRelativeRect.top + triangleRelativeRect.height / 2
			}
		}
		else {
			let [d1] = this.alignDirections
			point = getAnchorPointAt(contentRect, d1)
	
			// From absolute to relative.
			point.x -= contentRect.x
			point.y -= contentRect.y
		}

		return point
	}

	/** Get absolute position of anchor in the origin of scrolling page. */
	private getAnchorAbsoluteAnchorPoint(anchorRect: DOMRect): Coord {
		let [, d2] = this.alignDirections
		let point = getAnchorPointAt(anchorRect, d2)

		return point
	}

	/** Add gap to a rough align position. */
	private addGapToAlignPosition(position: Coord) {
		let anchorDirection = this.alignDirections[1]
		let edgeKeys = anchorDirection.toBoxEdgeKeys()
		let alignVector = anchorDirection.toVector()

		for (let key of edgeKeys) {
			let gap = this.gaps[key]

			if (key === 'left' || key === 'right') {
				position.x += alignVector.x * gap
			}
			else {
				position.y += alignVector.y * gap
			}
		}
	}

	/** 
	 * Do vertical alignment, will modify `contentRect`.
	 * It outputs alignment position to `contentRect`.
	 */
	private alignVertical(y: number, anchorFaceDirection: Direction, contentRect: DOMRect, anchorRect: DOMRect, triangleSize: SizeLike | null) {
		let dh = document.documentElement.clientHeight
		let spaceTop = anchorRect.top - this.gaps.top
		let spaceBottom = dh - (anchorRect.bottom + this.gaps.bottom)
		let overflowOnY = false
		let h = contentRect.height

		if (anchorFaceDirection.beVertical) {

			// Not enough space at top side, switch to bottom.
			if (anchorFaceDirection === Direction.Top && y < 0 && spaceTop < spaceBottom && this.options.flipDirection) {
				y = anchorRect.bottom + this.gaps.bottom
				anchorFaceDirection = Direction.Bottom
			}

			// Not enough space at bottom side, switch to top.
			else if (anchorFaceDirection === Direction.Bottom && y + h > dh && spaceTop > spaceBottom && this.options.flipDirection) {
				y = anchorRect.top - this.gaps.top - h
				anchorFaceDirection = Direction.Top
			}
		}
		else {

			// Can move up a little to become fully visible.
			if (y + h + this.edgeGaps.bottom > dh && this.options.stickToEdges) {
				
				// Gives enough space for triangle.
				let minY = anchorRect.top + (triangleSize ? triangleSize.height : 0) - h
				y = Math.max(dh - h - this.edgeGaps.bottom, minY)
			}

			// Can move down a little to become fully visible.
			if (y - this.edgeGaps.top < 0 && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let maxY = anchorRect.bottom - (triangleSize ? triangleSize.height : 0)
				y = Math.min(this.edgeGaps.top, maxY)
			}
		}

		if (this.options.canShrinkOnY) {

			// Limit element height if has not enough space.
			if (anchorFaceDirection === Direction.Top && y < 0 && this.options.stickToEdges) {
				y = 0
				h = spaceTop
				overflowOnY = true
			}
			else if (anchorFaceDirection === Direction.Bottom && y + h > dh && this.options.stickToEdges) {
				h = spaceBottom
				overflowOnY = true
			}
			else if (!anchorFaceDirection.beVertical && contentRect.height > dh) {
				y = 0
				h = dh
				overflowOnY = true
			}
		}

		// Handle sticking to edges.
		else if (this.options.stickToEdges) {
			if (anchorFaceDirection.beVertical) {
				y = Math.min(y, dh - contentRect.height)
				y = Math.max(0, y)
			}
		}

		contentRect.y = y

		// Apply limited height.
		if (overflowOnY) {
			this.target.style.height = h + 'px'
			contentRect.height = h
		}

		return {anchorFaceDirection, overflowOnY}
	}

	/** 
	 * Do horizontal alignment.
	 * It outputs alignment position to `contentRect`.
	 */
	private alignHorizontal(x: number, anchorFaceDirection: Direction, contentRect: DOMRect, anchorRect: DOMRect, triangleSize: SizeLike | null) {
		let dw = document.documentElement.clientWidth
		let spaceLeft = anchorRect.left - this.gaps.left
		let spaceRight = dw - (anchorRect.right + this.gaps.right)
		let w = contentRect.width

		if (anchorFaceDirection.beHorizontal) {

			// Not enough space at left side.
			if (anchorFaceDirection === Direction.Left && x < 0 && spaceLeft < spaceRight && this.options.flipDirection) {
				x = anchorRect.right + this.gaps.right
				anchorFaceDirection = Direction.Right
			}

			// Not enough space at right side.
			else if (anchorFaceDirection === Direction.Right && x > dw - w && spaceLeft > spaceRight && this.options.flipDirection) {
				x = anchorRect.left - this.gaps.left - w
				anchorFaceDirection = Direction.Left
			}
		}
		else {

			// Can move left a little to become fully visible.
			if (x + w + this.edgeGaps.right > dw && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = anchorRect.left + (triangleSize ? triangleSize.width : 0) - w
				x = Math.max(dw - w - this.edgeGaps.right, minX)
			}

			// Can move right a little to become fully visible.
			if (x - this.edgeGaps.left < 0 && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = anchorRect.right - (triangleSize ? triangleSize.width : 0)
				x = Math.min(this.edgeGaps.left, minX)
			}
		}

		// Process sticking to edges.
		if (this.options.stickToEdges) {
			if (anchorFaceDirection.beHorizontal) {
				x = Math.min(x, dw - contentRect.width)
				x = Math.max(0, x)
			}
		}

		contentRect.x = x

		return anchorFaceDirection
	}

	/** Align `triangle` relative to target. */
	private alignTriangle(anchorFaceDirection: Direction, contentRect: DOMRect, anchorRect: DOMRect, triangleRelativeRect: DOMRect) {
		let triangle = this.options.triangle!
		let transforms: string[] = []

		if (anchorFaceDirection.beVertical) {
			let x = this.calcTriangleX(
				contentRect.width,
				anchorRect.width, anchorRect.x - contentRect.x,
				triangleRelativeRect.width, triangleRelativeRect.x
			)

			let translateX = x - triangleRelativeRect.x
			transforms.push(`translateX(${translateX}px)`)
		}
		else if (anchorFaceDirection.beHorizontal) {
			let y = this.calcTriangleX(
				contentRect.height,
				anchorRect.height, anchorRect.y - contentRect.y,
				triangleRelativeRect.height, triangleRelativeRect.y
			)

			let translateY = y - triangleRelativeRect.y
			transforms.push(`translateY(${translateY}px)`)
		}

		let triangleSwapped = anchorFaceDirection !== this.anchorFaceDirection
	
		if (triangleSwapped) {
			if (anchorFaceDirection.beHorizontal) {
				transforms.push('scaleX(-1)')
			}
			else {
				transforms.push('scaleY(-1)')
			}
		}

		if (triangleSwapped !== this.alignmentState.triangleSwapped) {
			if (anchorFaceDirection === Direction.Top) {
				triangle.style.top = 'auto'
				triangle.style.bottom = -triangleRelativeRect.height + 'px'
			}
			else if (anchorFaceDirection === Direction.Bottom) {
				triangle.style.top = -triangleRelativeRect.height + 'px'
				triangle.style.bottom = ''
			}
			else if (anchorFaceDirection === Direction.Left) {
				triangle.style.left = 'auto'
				triangle.style.right = -triangleRelativeRect.width + 'px'
			}
			else if (anchorFaceDirection === Direction.Right) {
				triangle.style.left = -triangleRelativeRect.width + 'px'
				triangle.style.right = ''
			}

			this.alignmentState.triangleSwapped = anchorFaceDirection !== this.anchorFaceDirection
		}

		this.alignmentState.triangleTransformed = transforms.length > 0
		triangle.style.transform = transforms.join(' ')
	}

	/** All x coordinates based on content origin. */
	private calcTriangleX(
		contentW: number,
		anchorW: number, anchorX: number,
		triangleW: number, triangleX: number
	) {
		let x: number = 0

		// In fixed position.
		if (this.options.fixedTriangle) {
			x = triangleX
		}

		// Align with center of target, normally.
		else if (this.alignDirections[0].beStraight) {
			x = contentW / 2 - triangleW / 2
		}

		// Align with center of anchor.
		else if (this.alignDirections[1].beStraight && !this.alignDirections[0].beStraight) {
			x = (anchorX + anchorW) / 2 - triangleW / 2
		}

		// Align non-center to non-center, also choose narrower one.
		else {
			if (contentW <= anchorW) {
				x = contentW / 2 - triangleW / 2
			}
			else {
				x = (anchorX + anchorW) / 2 - triangleW / 2
			}
		}

		// Limit to the intersect edge of content and anchors.
		let minX = Math.max(0, anchorX)
		let maxX = Math.min(contentW - triangleW / 2, anchorX + anchorW - triangleW / 2)

		x = Math.max(x, minX)
		x = Math.min(x, maxX)

		return x
	}
}


/** Position string -> Direction. */
const PositionDirectionMap: Record<string, Direction> = {
	c: Direction.Center,
	t: Direction.Top,
	b: Direction.Bottom,
	l: Direction.Left,
	r: Direction.Right,
	cc: Direction.Center,
	tl: Direction.TopLeft,
	tr: Direction.TopRight,
	tc: Direction.Top,
	bl: Direction.BottomLeft,
	br: Direction.BottomRight,
	bc: Direction.Bottom,
}

/**
 * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of anchor][X of anchor]`.
 * Shorter type should be `[Touch][Align]` or `[Touch]`.
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align content to the top-center of anchor.
 * E.g.: `tl` is short for `bl-tl`, which means align content to the top-left of anchor.
 * E.g.: `lt` is short for `tr-tl`, which means align content to the left-top of anchor.
 */
function parseAlignDirections(position: AnchorPosition): [Direction, Direction] {
	if (!/^(?:[tbc][lrc]-[tbc][lrc]|[tbclr]-[tbclr]|[tbc][lrc]|[tbclr])/.test(position)) {
		throw `"${position}" is not a valid position string!`
	}

	let d1: Direction
	let d2: Direction

	if (position.length <= 2) {

		// `t` means `b-t`.
		d2 = PositionDirectionMap[position]
		d1 = d2.opposite
	}
	else {
		let posArray = position.split('-')
		d1 = PositionDirectionMap[posArray[0]]
		d2 = PositionDirectionMap[posArray[1]]
	}

	return [d1, d2]
}


/** Parse margin values to get a margin object, and apply triangle size to it. */
function parseGaps(gapValue: number | number[], triangle: HTMLElement | undefined, anchorFaceDirection: Direction): AnchorGaps {
	let gap: AnchorGaps

	if (typeof gapValue === 'number') {
		gap = {
			top: gapValue,
			right: gapValue,
			bottom: gapValue,
			left: gapValue,
		}
	}
	else {
		gap = {
			top: gapValue[0],
			right: gapValue[1] ?? gapValue[0],
			bottom: gapValue[2] ?? gapValue[0],
			left: gapValue[3] ?? gapValue[1] ?? gapValue[0],
		}
	}
	
	if (triangle) {
		if (anchorFaceDirection.beVertical) {
			gap.top += triangle.offsetHeight
			gap.bottom += triangle.offsetHeight
		}

		if (anchorFaceDirection.beHorizontal) {
			gap.right += triangle.offsetWidth
			gap.left += triangle.offsetWidth
		}
	}

	return gap
}


/** Test whether two rects are equal. */
function isRectsEqual(rect1: DOMRect, rect2: DOMRect): boolean {
	return rect1.x === rect2.x
		&& rect1.y === rect2.y
		&& rect1.width === rect2.width
		&& rect1.height === rect2.height
}


/** Get the anchor point by a rect and direction. */
function getAnchorPointAt(rect: DOMRect, d: Direction): Coord {
	let v = d.toAnchorVector()

	return {
		x: rect.x + v.x * rect.width,
		y: rect.y + v.y * rect.height,
	}
}


/** Get a closest ancestral element which has fixed position. */
function findClosestFixedElement(el: Element): HTMLElement | null {
	while (el && el !== document.documentElement) {
		if (getComputedStyle(el).position === 'fixed') {
			break
		}
		el = el.parentElement!
	}

	return el === document.documentElement ? null : el as HTMLElement
}
