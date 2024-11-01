import {Direction} from '../math'
import {ObjectUtils} from '../utils'
import * as DOMUtils from '../utils/dom-utils'


/** Options for aligning two elements. */
export interface AlignerOptions {

	/** 
	 * Align where of content element to where of target element.
	 * e.g., `tl-bl` means align top-left of content, to bottom-left of target
	 * First part, can be omitted, will pick opposite: `t-b` equals `b`, `tl-br` equals `br`.
	 */
	position: AlignerPosition

 	/** 
	  * The gaps betweens content element and target element.
	  * It nearly equals expanding target element area with this value.
	  * can be a number or a number array composed of 1-4 numbers, in `top right? bottom? left?` order.
	  */
	gap: number | number[]

	/** 
	 * Whether stick content element to viewport edges.
	 * Such that if content element partly cut by viewport,
	 * it will be adjusted to stick viewport edges and become fully visible.
	 * Default value is `true`, set it to `false` to disable.
	 */
	stickToEdges: boolean

	/** 
	 * Whether can swap content position if spaces in specified position is not enough.
	 * Default value is `true`, set it to `false` to disable.
	 */
	canSwapPosition: boolean

	/** 
	 * If `true`, when content element contains large content and should be cut in viewport,
	 * it will be shrunk by limiting height.
	 * Note that a descendant element of content element must set `overflow-y: auto`.
	 * 
	 * Note if wanting restore original height before next time aligning,
	 * you must use same `Aligner` to align.
	 */
	canShrinkOnY: boolean

	/** 
	 * Whether should align triangle in a fixed position.
	 * 
	 * Default value is `false`, means triangle element will be anchored to be
	 * in the center of the intersect edges between content and target element.
	 * 
	 * If specified as `true`, e.g., triangle always locates at top-left corner.
	 * will use the position of the triangle acute angle to align,
	 * instead of the content element anchor point at specified position.
	 */
	fixTriangle: boolean
	
	/** 
	 * The triangle element inside content element,
	 * If provided, will adjust it's left or top position, and transform property,
	 * to anchor it to be in the center of the intersect edges between content and target element.
	 */
	triangle?: HTMLElement
}

/** Align where of content element to where of target element. */
export type AlignerSinglePosition = 't'
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

/** Align where of content element to where of target element. */
export type AlignerPosition = AlignerSinglePosition
	| 'b-b'
	| 'b-t'

	| 't-t'
	| 't-b'

	| 'l-l'
	| 'l-r'

	| 'r-r'
	| 'r-l'

	| 'c-c'

	| 'bl-bl'
	| 'bl-br'
	| 'bl-bc'
	| 'bl-tl'
	| 'bl-tr'
	| 'bl-tc'

	| 'br-bl'
	| 'br-br'
	| 'br-bc'
	| 'br-tl'
	| 'br-tr'
	| 'br-tc'

	| 'bc-bl'
	| 'bc-br'
	| 'bc-bc'
	| 'bc-tl'
	| 'bc-tr'
	| 'bc-tc'

	| 'tl-tl'
	| 'tl-tr'
	| 'tl-tc'
	| 'tl-bl'
	| 'tl-br'
	| 'tl-bc'

	| 'tr-tl'
	| 'tr-tr'
	| 'tr-tc'
	| 'tr-bl'
	| 'tr-br'
	| 'tr-bc'

	| 'tc-tl'
	| 'tc-tr'
	| 'tc-tc'
	| 'tc-bl'
	| 'tc-br'
	| 'tc-bc'

	| 'cl-cr'
	| 'cr-cl'

/** 4 directions of gap. */
interface AlignerGap {
	top: number
	right: number
	bottom: number
	left: number
}

/** Shared content alignment state. */
interface ContentAlignmentState {

	/** Whether triangle element has get transformed. */
	triangleTransformed: boolean

	/** Whether triangle element has been swapped to opposite position. */
	triangleSwapped: boolean

	/** Whether have shrink content element on Y axis. */
	haveShrinkOnY: boolean
}

const DefaultContentAlignmentState: ContentAlignmentState = {
	triangleTransformed: false,
	triangleSwapped: false,
	haveShrinkOnY: false,
}

const SharedContentAlignmentState: WeakMap<HTMLElement, ContentAlignmentState> = new WeakMap()


const DefaultAlignerOptions: AlignerOptions = {
	position: 'b',
	gap: 0,
	stickToEdges: true,
	canSwapPosition: true,
	canShrinkOnY: false,
	fixTriangle: false,
	triangle: undefined,
}

export class Aligner {
	
	/** 
	 * Get the direction that target element face to content element.
	 * Always get a straight direction.
	 */
	static getTargetFaceDirection(position: AlignerPosition): Direction {
		let [d1, d2] = parseAlignDirections(position)
		return d2.joinToStraight(d1.opposite)
	}
	

	/** The content element to align. */
	readonly content: HTMLElement

	/** Target target element to align besides. */
	readonly target: Element

	/** Full options. */
	private options!: AlignerOptions

	/** Directions of content and target elements. */
	private directions!: [Direction, Direction]

	/**
	 * In which direction, and also the only direction
	 * the target element face with content element.
	 * This is always a straight direction.
	 * 
	 * E.g.:
	 *  - `tl-bl` -> `Bottom`.
	 *  - `c-c` -> `Center`.
	 */
	private targetFaceDirection!: Direction

	/** Gaps betweens target and content element. */
	private gaps!: AlignerGap

	/** Represent previous alignment state. */
	private alignmentState: ContentAlignmentState

	/** Whether content element use fixed alignment position. */
	private useFixedAlignment: boolean = false

	private cachedContentRect: DOMRect | null = null
	private cachedTargetRect: DOMRect | null = null

	constructor(content: HTMLElement, target: Element) {
		this.content = content
		this.target = target

		if (SharedContentAlignmentState.has(content)) {
			this.alignmentState = SharedContentAlignmentState.get(content)!
		}
		else {
			this.alignmentState = {...DefaultContentAlignmentState}
			SharedContentAlignmentState.set(content, this.alignmentState)
		}
	}

	/** 
	 * Align content to beside target element.
	 * Returns whether did alignment.
	 */
	align(options: Partial<AlignerOptions> = {}): boolean {
		let optionsChanged = this.initOptions(options)
		let contentRect = this.content.getBoundingClientRect()
		let targetRect = this.target.getBoundingClientRect()

		// Pick viewport for document element.
		if (this.target === document.documentElement) {
			targetRect.x = 0
			targetRect.y = 0
		}

		// Both rects have not changed.
		if (!optionsChanged
			&& this.cachedContentRect && isRectsEqual(this.cachedContentRect, contentRect)
			&& this.cachedTargetRect && isRectsEqual(this.cachedTargetRect, targetRect)
		) {
			return true
		}

		// If target is not visible.
		if (targetRect.width === 0 && targetRect.height === 0) {
			return false
		}		

		return this.alignByRects(contentRect, targetRect)
	}

	/** Align content element to the position of a mouse event. */
	alignToEvent(event: MouseEvent, options: Partial<AlignerOptions> = {}) {
		let optionsChanged = this.initOptions(options)
		let contentRect = this.content.getBoundingClientRect()

		let targetRect = new DOMRect(
			event.clientX,
			event.clientY,
			0,
			0
		)

		// Both rects have not changed.
		if (!optionsChanged
			&& this.cachedContentRect && isRectsEqual(this.cachedContentRect, contentRect)
			&& this.cachedTargetRect && isRectsEqual(this.cachedTargetRect, targetRect)
		) {
			return true
		}

		return this.alignByRects(contentRect, targetRect)
	}

	/** 
	 * Get initialize by partial options.
	 * Returns whether options get changed.
	 */
	private initOptions(options: Partial<AlignerOptions> = {}): boolean {
		let newOptions = ObjectUtils.assignNonExistent(options, DefaultAlignerOptions)

		let changed = !ObjectUtils.deepEqual(this.options, newOptions)
		if (changed) {
			this.options = newOptions
		}

		this.directions = parseAlignDirections(newOptions.position)
		this.targetFaceDirection = this.directions[1].joinToStraight(this.directions[0].opposite)
		this.gaps = parseGap(newOptions.gap, newOptions.triangle, this.targetFaceDirection)

		// If target element is not affected by document scrolling, content element should be the same.
		// A potential problem here: once becomes fixed, can't be restored for reuseable popups.
		if (findClosestFixedElement(this.target)) {
			this.content.style.position = 'fixed'
			this.useFixedAlignment = true
		}
		else {
			this.useFixedAlignment = getComputedStyle(this.content).position === 'fixed'
		}

		return changed
	}

	/** Align content after known both rects. */
	private alignByRects(contentRect: DOMRect, targetRect: DOMRect): boolean {
		let targetFaceDirection = this.targetFaceDirection

		// Reset styles before doing alignment.
		this.resetStyles()

		// Whether target in viewport.
		let targetInViewport = DOMUtils.isRectIntersectWithViewport(targetRect)
		let willAlign = targetInViewport || !this.options.stickToEdges
		if (!willAlign) {
			return false
		}

		// content may be shrunk into the edge and it's width get limited.
		if (this.shouldClearContentPosition(contentRect)) {
			this.clearContentPosition()
			contentRect = this.content.getBoundingClientRect()
		}

		// Get triangle rect based on content origin.
		let triangleRelativeRect = this.getTriangleRelativeRect(contentRect)

		// Do content alignment.
		let alignResult = this.doAlignment(targetFaceDirection, contentRect, targetRect, triangleRelativeRect)
		targetFaceDirection = alignResult.targetFaceDirection
		this.alignmentState.haveShrinkOnY = alignResult.overflowYSet

		// Handle `triangle` position.
		if (this.options.triangle) {
			this.alignTriangle(targetFaceDirection, contentRect, targetRect, triangleRelativeRect!)
		}

		this.cachedContentRect = contentRect
		this.cachedTargetRect = targetRect

		return true
	}

	/** Set some styles of content and triangle element before doing alignment. */
	private resetStyles() {
		
		// Avoid it's height overflow cause body scrollbar appears.
		if (this.options.canShrinkOnY && this.content.offsetHeight > document.documentElement.clientHeight) {
			this.content.style.height = '100vh'
		}
		else if (this.alignmentState.haveShrinkOnY && this.content.style.height) {
			this.content.style.height = ''
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
		this.content.style.left = '0'
		this.content.style.right = ''
		this.content.style.top = '0'
	}

	/** Get triangle rect based on content element origin. */
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
	private doAlignment(targetFaceDirection: Direction, contentRect: DOMRect, targetRect: DOMRect, triangleRelativeRect: DOMRect | null) {
		let anchor1 = this.getContentRelativeAnchorPoint(targetFaceDirection, contentRect, triangleRelativeRect)
		let anchor2 = this.getTargetAbsoluteAnchorPoint(targetRect)

		// Fixed content element position.
		let position = {x: anchor2.x - anchor1.x, y: anchor2.y - anchor1.y}
		this.addGapToAlignPosition(position, targetFaceDirection)

		// Handle vertical alignment.
		let alignResult = this.alignVertical(position.y, targetFaceDirection, contentRect, targetRect, triangleRelativeRect)
		let overflowYSet = alignResult.overflowYSet
		targetFaceDirection = alignResult.targetFaceDirection

		// If content element's height changed.
		if (overflowYSet) {
			anchor1 = this.getContentRelativeAnchorPoint(targetFaceDirection, contentRect, triangleRelativeRect)
			position = {x: anchor2.x - anchor1.x, y: anchor2.y - anchor1.y}
			this.addGapToAlignPosition(position, targetFaceDirection)
		}

		// Handle horizontal alignment.
		targetFaceDirection = this.alignHorizontal(position.x, targetFaceDirection, contentRect, targetRect, triangleRelativeRect)

		// The fixed position of content currently.
		let x = contentRect.x
		let y = contentRect.y

		// For absolute layout content, convert x, y to absolute position.
		if (!this.useFixedAlignment && this.target !== document.body && this.target !== document.documentElement) {
			var offsetParent = this.content.offsetParent as HTMLElement

			// If we use body's top position, it will cause a bug when body has a margin top (even from margin collapse).
			if (offsetParent) {
				var parentRect = offsetParent.getBoundingClientRect()
				x -= parentRect.left
				y -= parentRect.top
			}
		}

		// May scrollbar appears after alignment,
		// such that it should align to right.
		if (targetFaceDirection === Direction.Left) {
			this.content.style.left = 'auto'
			this.content.style.right = document.documentElement.clientWidth - contentRect.right + 'px'
		}
		else {
			this.content.style.left = x + 'px'
			this.content.style.right = 'auto'
		}

		this.content.style.top = y + 'px'

		return {
			overflowYSet,
			targetFaceDirection,
		}
	}

	/** Get relative anchor position in the origin of content element. */
	private getContentRelativeAnchorPoint(targetFaceDirection: Direction, contentRect: DOMRect, triangleRelativeRect: DOMRect | null): Coord {
		let point = {x: 0, y: 0}

		// Anchor at triangle position.
		if (this.options.fixTriangle && triangleRelativeRect) {
			if (targetFaceDirection.beVertical) {
				point.x = triangleRelativeRect.left + triangleRelativeRect.width / 2
			}
			else if (targetFaceDirection.beHorizontal) {
				point.y = triangleRelativeRect.top + triangleRelativeRect.height / 2
			}
		}
		else {
			let [d1] = this.directions
			point = getAnchorPointAt(contentRect, d1)
	
			// From absolute to relative.
			point.x -= contentRect.x
			point.y -= contentRect.y
		}

		return point
	}

	/** Get absolute anchor position of target element in the origin of scrolling page. */
	private getTargetAbsoluteAnchorPoint(targetRect: DOMRect): Coord {
		let [, d2] = this.directions
		let point = getAnchorPointAt(targetRect, d2)

		return point
	}

	/** Add gap to a rough align position. */
	private addGapToAlignPosition(position: Coord, targetFaceDirection: Direction) {
		let edgeKey = targetFaceDirection.toBoxEdgeKey()
		let gap = edgeKey ? this.gaps[edgeKey] : 0
		let faceVector = targetFaceDirection.toVector()

		position.x += faceVector.x * gap
		position.y += faceVector.y * gap
	}

	/** 
	 * Do vertical alignment, will modify `contentRect`.
	 * It outputs alignment position to `contentRect`.
	 */
	private alignVertical(y: number, targetFaceDirection: Direction, contentRect: DOMRect, targetRect: DOMRect, triangleSize: SizeLike | null) {
		let dh = document.documentElement.clientHeight
		let spaceTop = targetRect.top - this.gaps.top
		let spaceBottom = dh - (targetRect.bottom + this.gaps.bottom)
		let overflowYSet = false
		let h = contentRect.height

		if (targetFaceDirection.beVertical) {

			// Not enough space at top side, switch to bottom.
			if (targetFaceDirection === Direction.Top && y < 0 && spaceTop < spaceBottom && this.options.canSwapPosition) {
				y = targetRect.bottom + this.gaps.bottom
				targetFaceDirection = Direction.Bottom
			}

			// Not enough space at bottom side, switch to top.
			else if (targetFaceDirection === Direction.Bottom && y + h > dh && spaceTop > spaceBottom && this.options.canSwapPosition) {
				y = targetRect.top - this.gaps.top - h
				targetFaceDirection = Direction.Top
			}
		}
		else {

			// Can move up a little to become fully visible.
			if (y + h > dh && this.options.stickToEdges) {
				
				// Gives enough space for triangle.
				let minY = targetRect.top + (triangleSize ? triangleSize.height : 0) - h
				y = Math.max(dh - h, minY)
			}

			// Can move down a little to become fully visible.
			if (y < 0 && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let maxY = targetRect.bottom - (triangleSize ? triangleSize.height : 0)
				y = Math.min(0, maxY)
			}
		}

		if (this.options.canShrinkOnY) {

			// Limit element height if has not enough space.
			if (targetFaceDirection === Direction.Top && y < 0 && this.options.stickToEdges) {
				y = 0
				h = spaceTop
				overflowYSet = true
			}
			else if (targetFaceDirection === Direction.Bottom && y + h > dh && this.options.stickToEdges) {
				h = spaceBottom
				overflowYSet = true
			}
			else if (!targetFaceDirection.beVertical && contentRect.height > dh) {
				y = 0
				h = dh
				overflowYSet = true
			}
		}

		// Handle sticking to edges.
		else if (this.options.stickToEdges) {
			if (targetFaceDirection.beVertical) {
				y = Math.min(y, dh - contentRect.height)
				y = Math.max(0, y)
			}
		}

		contentRect.y = y

		// Apply limited height.
		if (overflowYSet) {
			this.content.style.height = h + 'px'
			contentRect.height = h
		}

		return {targetFaceDirection, overflowYSet}
	}

	/** 
	 * Do horizontal alignment.
	 * It outputs alignment position to `contentRect`.
	 */
	private alignHorizontal(x: number, targetFaceDirection: Direction, contentRect: DOMRect, targetRect: DOMRect, triangleSize: SizeLike | null) {
		let dw = document.documentElement.clientWidth
		let spaceLeft = targetRect.left - this.gaps.left
		let spaceRight = dw - (targetRect.right + this.gaps.right)
		let w = contentRect.width

		if (targetFaceDirection.beHorizontal) {

			// Not enough space at left side.
			if (targetFaceDirection === Direction.Left && x < 0 && spaceLeft < spaceRight && this.options.canSwapPosition) {
				x = targetRect.right + this.gaps.right
				targetFaceDirection = Direction.Right
			}

			// Not enough space at right side.
			else if (targetFaceDirection === Direction.Right && x > dw - w && spaceLeft > spaceRight && this.options.canSwapPosition) {
				x = targetRect.left - this.gaps.left - w
				targetFaceDirection = Direction.Left
			}
		}
		else {

			// Can move left a little to become fully visible.
			if (x + w > dw && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = targetRect.left + (triangleSize ? triangleSize.width : 0) - w
				x = Math.max(dw - w, minX)
			}

			// Can move right a little to become fully visible.
			if (x < 0 && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = targetRect.right - (triangleSize ? triangleSize.width : 0)
				x = Math.min(0, minX)
			}
		}

		// Process sticking to edges.
		if (this.options.stickToEdges) {
			if (targetFaceDirection.beHorizontal) {
				x = Math.min(x, dw - contentRect.width)
				x = Math.max(0, x)
			}
		}

		contentRect.x = x

		return targetFaceDirection
	}

	/** Align `triangle` relative to content element. */
	private alignTriangle(targetFaceDirection: Direction, contentRect: DOMRect, targetRect: DOMRect, triangleRelativeRect: DOMRect) {
		let triangle = this.options.triangle!
		let transforms: string[] = []

		if (targetFaceDirection.beVertical) {
			let x = this.calcTriangleX(
				contentRect.width,
				targetRect.width, targetRect.x - contentRect.x,
				triangleRelativeRect.width, triangleRelativeRect.x
			)

			let translateX = x - triangleRelativeRect.x
			transforms.push(`translateX(${translateX}px)`)
		}
		else if (targetFaceDirection.beHorizontal) {
			let y = this.calcTriangleX(
				contentRect.height,
				targetRect.height, targetRect.y - contentRect.y,
				triangleRelativeRect.height, triangleRelativeRect.y
			)

			let translateY = y - triangleRelativeRect.y
			transforms.push(`translateY(${translateY}px)`)
		}

		let triangleSwapped = targetFaceDirection !== this.targetFaceDirection
	
		if (triangleSwapped) {
			if (targetFaceDirection.beHorizontal) {
				transforms.push('scaleX(-1)')
			}
			else {
				transforms.push('scaleY(-1)')
			}
		}

		if (triangleSwapped !== this.alignmentState.triangleSwapped) {
			if (targetFaceDirection === Direction.Top) {
				triangle.style.top = 'auto'
				triangle.style.bottom = -triangleRelativeRect.height + 'px'
			}
			else if (targetFaceDirection === Direction.Bottom) {
				triangle.style.top = -triangleRelativeRect.height + 'px'
				triangle.style.bottom = ''
			}
			else if (targetFaceDirection === Direction.Left) {
				triangle.style.left = 'auto'
				triangle.style.right = -triangleRelativeRect.width + 'px'
			}
			else if (targetFaceDirection === Direction.Right) {
				triangle.style.left = -triangleRelativeRect.width + 'px'
				triangle.style.right = ''
			}

			this.alignmentState.triangleSwapped = targetFaceDirection !== this.targetFaceDirection
		}

		this.alignmentState.triangleTransformed = transforms.length > 0
		triangle.style.transform = transforms.join(' ')
	}

	/** All x coordinates based on content origin. */
	private calcTriangleX(
		contentW: number,
		targetW: number, targetX: number,
		triangleW: number, triangleX: number
	) {
		let x: number = 0

		// In fixed position.
		if (this.options.fixTriangle) {
			x = triangleX
		}

		// Align with center of content, normally.
		else if (this.directions[0].beStraight) {
			x = contentW / 2 - triangleW / 2
		}

		// Align with center of target.
		else if (this.directions[1].beStraight && !this.directions[0].beStraight) {
			x = (targetX + targetW) / 2 - triangleW / 2
		}

		// Align non-center to non-center, also choose narrower one.
		else {
			if (contentW <= targetW) {
				x = contentW / 2 - triangleW / 2
			}
			else {
				x = (targetX + targetW) / 2 - triangleW / 2
			}
		}

		// Limit to the intersect edge of content and target.
		let minX = Math.max(0, targetX)
		let maxX = Math.min(contentW - triangleW / 2, targetX + targetW - triangleW / 2)

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
 * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of target][X of target]`.
 * Shorter type should be `[Touch][Align]` or `[Touch]`.
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align content to the top-center of target.
 * E.g.: `tl` is short for `bl-tl`, which means align content to the top-left of target.
 * E.g.: `lt` is short for `tr-tl`, which means align content to the left-top of target.
 */
function parseAlignDirections(position: AlignerPosition): [Direction, Direction] {
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
function parseGap(gapValue: number | number[], triangle: HTMLElement | undefined, targetFaceDirection: Direction): AlignerGap {
	let gap: AlignerGap

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
		if (targetFaceDirection.beVertical) {
			gap.top += triangle.offsetHeight
			gap.bottom += triangle.offsetHeight
		}

		if (targetFaceDirection.beHorizontal) {
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
