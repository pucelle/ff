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
export type AlignerPosition = 't'
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

interface AlignerGap {
	top: number
	right: number
	bottom: number
	left: number
}


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
	 * Align content to target element with specified position.
	 * If no enough space, will adjust align position automatically.
	 * @param content Element that will be adjusted position to do alignment.
	 * @param target Element as anchor that content element should align to.
	 * @param options Aligner options.
	 */
	static align(content: HTMLElement, target: Element, options: Partial<AlignerOptions> = {}) {
		new Aligner(content, target).align(options)
	}

	/** Align element to the position of a mouse event. */
	static alignEvent(el: HTMLElement, event: MouseEvent, offset: [number, number] = [0, 0]) {
		if (DOMUtils.getStyleValue(el, 'position') !== 'fixed') {
			throw new Error(`Element to use "alignEvent" must have fixed layout!`)
		}

		let dw = document.documentElement.clientWidth
		let dh = document.documentElement.clientHeight
		let w  = el.offsetWidth
		let h  = el.offsetHeight
		let ex = event.clientX
		let ey = event.clientY
		let x = ex + offset[0]
		let y = ey + offset[1]

		if (x + w > dw) {
			x = dw - w
		}

		if (y + h > dh) {
			y = dh - h
		}

		el.style.left = Math.round(x) + 'px'
		el.style.top = Math.round(y) + 'px'
	}

	/** 
	 * Get the direction that target element face to content element.
	 * Always get a straight direction.
	 */
	static getTargetFaceDirection(position: string): Direction {
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

	/** Whether content element use fixed alignment position. */
	private useFixedAlignment: boolean = false

	/** Whether triangle element has get transformed. */
	private triangleTransformed: boolean = false

	/** In the which direction the triangle located. */
	private triangleDirection: Direction | null = null

	/** Whether have shrink content element on Y axis. */
	private haveShrinkOnY: boolean = false

	private cachedContentRect: DOMRect | null = null
	private cachedTargetRect: DOMRect | null = null

	constructor(content: HTMLElement, anchor: Element) {
		this.content = content
		this.target = anchor
	}

	/** 
	 * Align content to beside target element.
	 * Returns whether did alignment.
	 */
	align(options: Partial<AlignerOptions> = {}): boolean {
		this.initOptions(options)
		this.resetStyles()

		let targetFaceDirection = this.targetFaceDirection
		let contentRect = this.content.getBoundingClientRect()
		let targetRect = this.target.getBoundingClientRect()

		// Both rects have not changed.
		if (this.cachedContentRect && isRectsEqual(this.cachedContentRect, contentRect)
			&& this.cachedTargetRect && isRectsEqual(this.cachedTargetRect, targetRect)
		) {
			return true
		}

		// If target is not visible.
		if (targetRect.width === 0 && targetRect.height === 0) {
			return false
		}

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
		this.haveShrinkOnY = alignResult.overflowYSet

		// Handle `triangle` position.
		if (this.options.triangle) {
			this.alignTriangle(targetFaceDirection, contentRect, targetRect, triangleRelativeRect!)
		}

		this.cachedContentRect = contentRect
		this.cachedTargetRect = targetRect
	
		return true
	}

	/** Get initialize by partial options. */
	private initOptions(options: Partial<AlignerOptions> = {}) {
		this.options = ObjectUtils.assignNonExisted(options, DefaultAlignerOptions)

		this.directions = parseAlignDirections(this.options.position)
		this.targetFaceDirection = this.directions[1].joinToStraight(this.directions[0].opposite)
		this.gaps = parseGap(this.options.gap, this.options.triangle, this.targetFaceDirection)

		// Initialize triangle direction.
		this.initTriangleDirection()

		// If target element is not affected by document scrolling, content element should be the same.
		// A potential problem here: once becomes fixed, can't be restored for reuseable popups.
		if (findClosestFixedElement(this.target)) {
			this.content.style.position = 'fixed'
			this.useFixedAlignment = true
		}
		else {
			this.useFixedAlignment = getComputedStyle(this.content).position === 'fixed'
		}
	}

	/** Initialize triangle direction. */
	private initTriangleDirection() {
		if (!this.options.triangle) {
			return
		}

		// Initialize for only once.
		if (this.triangleDirection) {
			return
		}

		let style = getComputedStyle(this.options.triangle)
		let left = parseInt(style.left)
		let right = parseInt(style.right)
		let top = parseInt(style.top)
		let bottom = parseInt(style.bottom)
		let d: Direction = Direction.Top

		if (left < 0) {
			d = Direction.Left
		}
		else if (right < 0) {
			d = Direction.Right
		}
		else if (top < 0) {
			d = Direction.Top
		}
		else if (bottom < 0) {
			d = Direction.Bottom
		}

		this.triangleDirection = d
	}

	/** Set some styles of content and triangle element before doing alignment. */
	private resetStyles() {
		
		// Avoid it's height overflow cause body scrollbar appears.
		if (this.options.canShrinkOnY && this.content.offsetHeight > document.documentElement.clientHeight) {
			this.content.style.height = '100vh'
		}
		else if (this.haveShrinkOnY && this.content.style.height) {
			this.content.style.height = ''
		}

		// Restore triangle transform.
		if (this.options.triangle && this.triangleTransformed) {
			this.options.triangle.style.transform = ''
			this.triangleTransformed = false
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

		// When `fixTriangle`, it's relative position matters.
		if (this.options.fixTriangle) {
			let relativeTriangleRect = this.options.triangle ? this.options.triangle.getBoundingClientRect() : null
			if (relativeTriangleRect) {

				// Translate by rect position to become relative.
				relativeTriangleRect = new DOMRect(
					relativeTriangleRect.x - contentRect.x,
					relativeTriangleRect.y - contentRect.y,
					relativeTriangleRect.width,
					relativeTriangleRect.height
				)
			}

			return relativeTriangleRect
		}

		// Only size matters.
		else {
			return new DOMRect(
				0,
				0,
				this.options.triangle.offsetWidth,
				this.options.triangle.offsetHeight
			)
		}
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
	private alignVertical(y: number, targetFaceDirection: Direction, contentRect: DOMRect, targetRect: DOMRect, triangleRelativeRect: DOMRect | null) {
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
				let minY = targetRect.top + (triangleRelativeRect ? triangleRelativeRect.height : 0) - h
				y = Math.max(dh - h, minY)
			}

			// Can move down a little to become fully visible.
			if (y < 0 && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let maxY = targetRect.bottom - (triangleRelativeRect ? triangleRelativeRect.height : 0)
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
	private alignHorizontal(x: number, targetFaceDirection: Direction, contentRect: DOMRect, targetRect: DOMRect, triangleRelativeRect: DOMRect | null) {
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
				let minX = targetRect.left + (triangleRelativeRect ? triangleRelativeRect.width : 0) - w
				x = Math.max(dw - w, minX)
			}

			// Can move right a little to become fully visible.
			if (x < 0 && this.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = targetRect.right - (triangleRelativeRect ? triangleRelativeRect.width : 0)
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
		let w = contentRect.width
		let h = contentRect.height

		if (targetFaceDirection.beVertical) {
			let halfTriangleWidth = triangleRelativeRect.width / 2
			let x: number = 0

			// Adjust triangle to be in the center of the target edge.
			if ((w >= targetRect.width || this.options.fixTriangle)) {
				x = targetRect.left + targetRect.width / 2 - contentRect.left - halfTriangleWidth
			}

			// In fixed position.
			else if (this.options.fixTriangle) {
				x = triangleRelativeRect.x
			}

			// Adjust triangle to be in the center of the content edge.
			else {
				x = w / 2 - halfTriangleWidth
			}

			// Limit to at the intersect edge of content and target.
			let minX = Math.max(contentRect.left, targetRect.left)
			let maxX = Math.min(contentRect.left + contentRect.width, targetRect.right)

			// Turn to content rect origin.
			minX -= contentRect.left
			maxX -= contentRect.left

			// Turn to triangle left origin.
			minX -= halfTriangleWidth
			maxX -= halfTriangleWidth

			x = Math.max(x, minX)
			x = Math.min(x, maxX)

			if (this.options.fixTriangle) {
				let translateX = x - triangleRelativeRect.left
				transforms.push(`translateX(${translateX}px)`)
			}
			else {
				x -= DOMUtils.getNumericStyleValue(this.content, 'borderLeftWidth')
				triangle.style.left = x + 'px'
			}

			triangle.style.right = ''
		}

		if (targetFaceDirection.beHorizontal) {
			let halfTriangleHeight = triangleRelativeRect.height / 2
			let y: number

			if ((h >= targetRect.height || this.options.fixTriangle)) {
				y = targetRect.top + targetRect.height / 2 - contentRect.top - halfTriangleHeight
			}
			else if (this.options.fixTriangle) {
				y = triangleRelativeRect.top
			}
			else {
				y = h / 2 - halfTriangleHeight
			}

			// Limit to at the intersect edge of content and target.
			let minY = Math.max(contentRect.top, targetRect.top)
			let maxY = Math.min(contentRect.top + contentRect.height, targetRect.bottom)

			// Turn to content rect origin.
			minY -= contentRect.top
			maxY -= contentRect.top

			// Turn to triangle left origin.
			minY -= halfTriangleHeight
			maxY -= halfTriangleHeight

			y = Math.max(y, minY)
			y = Math.min(y, maxY)			

			if (this.options.fixTriangle) {
				let translateY = y - triangleRelativeRect.top
				transforms.push(`translateY(${translateY}px)`)
			}
			else {
				y -= DOMUtils.getNumericStyleValue(this.content, 'borderTopWidth')
				triangle.style.top = y + 'px'
			}

			triangle.style.bottom = ''
		}

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
	
		if (targetFaceDirection !== this.targetFaceDirection) {
			if (targetFaceDirection.beHorizontal) {
				transforms.push('scaleX(-1)')
			}
			else {
				transforms.push('scaleY(-1)')
			}
			
			this.triangleTransformed = true
		}

		triangle.style.transform = transforms.join(' ')
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
function parseAlignDirections(position: string): [Direction, Direction] {
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
