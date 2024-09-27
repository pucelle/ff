import {Box, Direction, BoxDistances, Point} from '../math'
import * as DOMUtils from '../utils/dom-utils'


/** Options for aligning two elements. */
export interface AlignerOptions {

 	/** 
	  * The gaps betweens content element and anchor element.
	  * It equals expanding anchor element area with this value.
	  * can be a number or a number array composed of 1-4 numbers, in `top right? bottom? left?` order.
	  */
	gap?: number | number[]

	/** 
	 * Whether stick content element to viewport edges.
	 * Such that if content element partly cut by viewport,
	 * it will be adjusted to stick viewport edges and become fully visible.
	 * Default value is `true`, set it to `false` to disable.
	 */
	stickToEdges?: boolean

	/** 
	 * Whether can swap content position if spaces in specified position is not enough.
	 * Default value is `true`, set it to `false` to disable.
	 */
	canSwapPosition?: boolean

	/** 
	 * If `true`, when content element contains large content and should be cut in viewport,
	 * it will be shrunk by limiting height.
	 * Note that a descendant element inside content element must set `overflow-y: auto`.
	 */
	canShrinkOnY?: boolean

	/** 
	 * Whether should align triangle in a fixed position.
	 * Default value is `false`, means triangle element will be anchored to be in the center of the intersect edges between content and anchor element.
	 */
	fixTriangle?: boolean
	
	/** 
	 * The triangle element inside content element,
	 * If provided, will adjust it's left or top position,
	 * to anchor it to be in the center of the intersect edges between content and anchor element.
	 */
	triangle?: HTMLElement
}

/** Align where of `align-to` element to where of the anchor element. */
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

type AlignerDirectionMask = Record<BoxDistanceKey, boolean>


const DefaultAlignerOptions: Omit<Required<AlignerOptions>, 'triangle' | 'gap'> = {
	stickToEdges: true,
	canSwapPosition: true,
	canShrinkOnY: false,
	fixTriangle: false,
}

export class Aligner implements Omit<AlignerOptions, 'gap'> {
	
	/**
	 * Align content to anchor element with specified position.
	 * If no enough space, will adjust align position automatically.
	 * @param content Element that will be adjusted position to do alignment.
	 * @param anchor Element as anchor that content element should align to.
	 * 
	 * @param alignPosition How the content would align with the anchor element.
	 * It normally contains two parts, e.g., `tl-br` means align top-left position
	 * of content element to bottom-right position of anchor element.
	 * `tl-br` can omit first part to `br`.
	 * `tc-bc` can omit `c` to `t-b`, and omit more to `b`.
	 */
	static align(content: HTMLElement, anchor: Element, alignPosition: AlignerPosition, options: AlignerOptions = {}) {
		new Aligner(content, anchor, alignPosition, options).align()
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
	 * Get main align direction by align position string,
	 * to indicate which direction to align content element relative to anchor element.
	 */
	static getMainAlignDirection(position: string): Direction {
		let [d1, d2] = parseAlignDirections(position)
		return d1.opposite.joinWith(d2)
	}


	readonly stickToEdges!: boolean
	readonly canSwapPosition!: boolean
	readonly canShrinkOnY!: boolean
	readonly fixTriangle!: boolean
	readonly triangle!: HTMLElement | undefined

	/** The element to align. */
	private readonly content: HTMLElement

	/** Target anchor element to align beside. */
	private readonly anchor: Element

	/** Directions of content and anchor elements. */
	private readonly directions: [Direction, Direction]

	/** In which direction of anchor element will be aligned. */
	private readonly directionMask: AlignerDirectionMask

	/** Margin outside of anchor element. */
	private readonly gaps: BoxDistances

	/** Whether content element use fixed alignment position. */
	private readonly useFixedAlignment: boolean

	private cachedRectBox: Box | null = null
	private cachedTargetRectBox: Box | null = null

	constructor(el: HTMLElement, anchor: Element, position: string, options: AlignerOptions = {}) {
		this.content = el
		this.anchor = anchor
		Object.assign(this, DefaultAlignerOptions, options)

		this.directions = parseAlignDirections(position)
		this.directionMask = parseAlignDirectionMask(this.directions)
		this.gaps = parseGap(options.gap || 0, this.triangle, this.directionMask)

		// If anchor element is not affected by document scrolling, content element should be the same.
		// A potential problem here: once becomes fixed, can't be restored for reuseable popups.
		if (getClosestFixedElement(this.anchor)) {
			this.content.style.position = 'fixed'
			this.useFixedAlignment = true
		}
		else {
			this.useFixedAlignment = getComputedStyle(this.content).position === 'fixed'
		}
	}

	/** 
	 * Align content to beside anchor element.
	 * Returns whether did alignment.
	 */
	align(): boolean {
		this.resetToAlignStyles()

		let directionMask = {...this.directionMask}
		let rect = getRectBox(this.content)
		let targetRect = getRectBox(this.anchor)

		// Both rects are not changed.
		if (this.cachedRectBox?.equals(rect) && this.cachedTargetRectBox?.equals(targetRect)) {
			return true
		}

		// If anchor is not visible.
		if (targetRect.empty) {
			return false
		}

		// Whether anchor in viewport.
		let targetInViewport = isRectBoxIntersectWithViewport(targetRect)
		let willAlign = targetInViewport || !this.stickToEdges
		if (!willAlign) {
			return false
		}

		// content may be shrunk into the edge and it's width get limited.
		if (this.shouldClearToAlignPosition(rect)) {
			this.clearToAlignPosition()
			rect = getRectBox(this.content)
		}

		// Get triangle rect based on content origin.
		let triangleRelativeRect = this.getTriangleRelativeRect(rect)

		// Restore content element height to it's natural height without any limitation.
		if (this.canShrinkOnY) {
			let willShrinkElement = findFirstScrollingDescendance(this.content)
			if (willShrinkElement) {
				rect.height += willShrinkElement.scrollHeight - willShrinkElement.clientHeight
			}
		}

		// Do content alignment.
		this.doAlignment(directionMask, rect, targetRect, triangleRelativeRect)

		// Handle `triangle` position.
		if (this.triangle) {
			this.alignTriangle(directionMask, rect, targetRect, triangleRelativeRect!)
		}

		this.cachedRectBox = rect
		this.cachedTargetRectBox = targetRect
	
		return true
	}

	/** Set some styles of content element before doing alignment. */
	private resetToAlignStyles() {
		
		// Avoid it's height cause body scrollbar appears.
		if (this.canShrinkOnY && this.content.offsetHeight > document.documentElement.clientHeight) {
			this.content.style.height = '100vh'
		}
		else if (this.canShrinkOnY && this.content.style.height) {
			this.content.style.height = ''
		}
	}

	/** Should clear last alignment properties, to avoid it's position affect it's size. */
	private shouldClearToAlignPosition(rect: Box) {

		// If rect of content close to window edge, it's width may be limited.
		return rect.left <= 0 || rect.right >= document.documentElement.clientWidth
	}

	/** Clear last alignment properties. */
	private clearToAlignPosition() {
		this.content.style.left = '0'
		this.content.style.right = ''
		this.content.style.top = '0'
	}

	/** Get triangle rect based on content element origin. */
	private getTriangleRelativeRect(rect: Box): Box | null {

		// `align` may be called for multiple times, so need to clear again.
		if (this.fixTriangle && this.triangle) {
			this.triangle.style.transform = ''
		}

		let relativeTriangleRect = this.triangle ? getRectBox(this.triangle) : null
		if (relativeTriangleRect) {
			relativeTriangleRect.translateSelf(-rect.x, -rect.y)
		}

		return relativeTriangleRect
	}

	/** 
	 * Do alignment from content to anchor for once.
	 * Overwrite the new alignment position into `rect`.
	 */
	private doAlignment(directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box | null) {
		let anchor1 = this.getToAlignRelativeAnchorPoint(directionMask, rect, triangleRelativeRect)
		let anchor2 = this.getTargetAbsoluteAnchorPoint(targetRect)

		// Fixed content element position.
		let fixedPosition = anchor2.diff(anchor1)

		// Handle vertical alignment.
		let overflowYSet = this.alignVertical(fixedPosition.y, directionMask, rect, targetRect, triangleRelativeRect)

		// If content element's height changed.
		if (overflowYSet) {
			anchor1 = this.getToAlignRelativeAnchorPoint(directionMask, rect, triangleRelativeRect)
			fixedPosition = anchor2.diff(anchor1)
		}

		// Handle horizontal alignment, `rect` will be modified.
		this.alignHorizontal(fixedPosition.x, directionMask, rect, targetRect, triangleRelativeRect)

		// The fixed coordinate of content currently.
		let x = rect.x
		let y = rect.y

		// For absolute layout content, convert x, y to absolute coordinate.
		if (!this.useFixedAlignment && this.anchor !== document.body && this.anchor !== document.documentElement) {
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
		if (directionMask.left) {
			this.content.style.left = 'auto'
			this.content.style.right = document.documentElement.clientWidth - rect.right + 'px'
		}
		else {
			this.content.style.left = x + 'px'
			this.content.style.right = 'auto'
		}

		this.content.style.top = y + 'px'
	}

	/** Get relative anchor position of the axis of content element. */
	private getToAlignRelativeAnchorPoint(directionMask: AlignerDirectionMask, rect: Box, triangleRelativeRect: Box | null): Point {
		let [d1] = this.directions
		let point = rect.anchorPointAt(d1)

		// Anchor at triangle position.
		if (this.fixTriangle && triangleRelativeRect) {
			if ((directionMask.top || directionMask.bottom) && !(directionMask.left || directionMask.right)) {
				point.x = triangleRelativeRect.left + triangleRelativeRect.width / 2
			}
			else if ((directionMask.left || directionMask.right) && !(directionMask.top || directionMask.bottom)) {
				point.y = triangleRelativeRect.top + triangleRelativeRect.height / 2
			}
		}

		return point
	}

	/** Get absolute anchor position of anchor element in scrolling page. */
	private getTargetAbsoluteAnchorPoint(targetRect: Box): Point {
		let [, d2] = this.directions
		let point = targetRect.anchorPointAt(d2)

		return point
	}

	/** Do vertical alignment. */
	private alignVertical(y: number, directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box | null): boolean {
		let dh = document.documentElement.clientHeight
		let spaceTop = targetRect.top - this.gaps.top
		let spaceBottom = dh - (targetRect.bottom + this.gaps.bottom)
		let overflowYSet = false
		let h = rect.height

		if (directionMask.top || directionMask.bottom) {

			// Not enough space at top side, switch to bottom.
			if (directionMask.top && y < 0 && spaceTop < spaceBottom && this.canSwapPosition) {
				y = targetRect.bottom + this.gaps.bottom
				directionMask.top = false
				directionMask.bottom = true
			}

			// Not enough space at bottom side, switch to top.
			else if (y + h > dh && spaceTop > spaceBottom && this.canSwapPosition) {
				y = targetRect.top - this.gaps.top - h
				directionMask.top = true
				directionMask.bottom = false
			}
		}
		else {

			// Can move up a little to become fully visible.
			if (y + h > dh && this.stickToEdges) {
				
				// Gives enough space for triangle.
				let minY = targetRect.top + (triangleRelativeRect ? triangleRelativeRect.height : 0) - h
				y = Math.max(dh - h, minY)
			}

			// Can move down a little to become fully visible.
			if (y < 0 && this.stickToEdges) {

				// Gives enough space for triangle.
				let maxY = targetRect.bottom - (triangleRelativeRect ? triangleRelativeRect.height : 0)
				y = Math.min(0, maxY)
			}
		}

		if (this.canShrinkOnY) {

			// Limit element height if has not enough space.
			if (directionMask.top && y < 0 && this.stickToEdges) {
				y = 0
				h = spaceTop
				overflowYSet = true
			}
			else if (directionMask.bottom && y + h > dh && this.stickToEdges) {
				h = spaceBottom
				overflowYSet = true
			}
			else if (!directionMask.top && !directionMask.bottom && rect.height > dh) {
				y = 0
				h = dh
				overflowYSet = true
			}
		}

		// Handle sticking to edges.
		else if (this.stickToEdges) {
			if (directionMask.top || directionMask.bottom) {
				y = Math.min(y, dh - rect.height)
				y = Math.max(0, y)
			}
		}

		rect.y = y

		// Apply limited height.
		if (overflowYSet) {
			this.content.style.height = h + 'px'
			rect.height = h
		}

		return overflowYSet
	}

	/** Do horizontal alignment. */
	private alignHorizontal(x: number, directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box | null) {
		let dw = document.documentElement.clientWidth
		let spaceLeft = targetRect.left - this.gaps.left
		let spaceRight = dw - (targetRect.right + this.gaps.right)
		let w = rect.width

		if (directionMask.left || directionMask.right) {

			// Not enough space at left side.
			if (directionMask.left && x < 0 && spaceLeft < spaceRight && this.canSwapPosition) {
				x = targetRect.right + this.gaps.right
				directionMask.left = false
				directionMask.right = true
			}

			// Not enough space at right side.
			else if (directionMask.right && x > dw - w && spaceLeft > spaceRight && this.canSwapPosition) {
				x = targetRect.left - this.gaps.left - w
				directionMask.left = true
				directionMask.right = false
			}
		}
		else {

			// Can move left a little to become fully visible.
			if (x + w > dw && this.stickToEdges) {

				// Gives enough space for triangle.
				let minX = targetRect.left + (triangleRelativeRect ? triangleRelativeRect.width : 0) - w
				x = Math.max(dw - w, minX)
			}

			// Can move right a little to become fully visible.
			if (x < 0 && this.stickToEdges) {

				// Gives enough space for triangle.
				let minX = targetRect.right - (triangleRelativeRect ? triangleRelativeRect.width : 0)
				x = Math.min(0, minX)
			}
		}

		// Process sticking to edges.
		if (this.stickToEdges) {
			if (directionMask.left || directionMask.right) {
				x = Math.min(x, dw - rect.width)
				x = Math.max(0, x)
			}
		}

		rect.x = x
	}

	/** Align `triangle` relative to content element. */
	private alignTriangle(directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box) {
		let triangle = this.triangle!
		let transforms: string[] = []
		let w = rect.width
		let h = rect.height

		if (directionMask.top) {
			triangle.style.top = 'auto'
			triangle.style.bottom = -triangleRelativeRect.height + 'px'
			transforms.push('rotateX(180deg)')
		}
		else if (directionMask.bottom) {
			triangle.style.top = -triangleRelativeRect.height + 'px'
			triangle.style.bottom = ''
		}
		else if (directionMask.left) {
			triangle.style.left = 'auto'
			triangle.style.right = -triangleRelativeRect.width + 'px'
			transforms.push('rotateY(180deg)')
		}
		else if (directionMask.right) {
			triangle.style.left = -triangleRelativeRect.width + 'px'
			triangle.style.right = ''
		}

		if (directionMask.top || directionMask.bottom) {
			let halfTriangleWidth = triangleRelativeRect.width / 2
			let x: number = 0

			// Adjust triangle to be in the center of the anchor edge.
			if ((w >= targetRect.width || this.fixTriangle)) {
				x = targetRect.left + targetRect.width / 2 - rect.left - halfTriangleWidth
			}

			// In fixed position.
			else if (this.fixTriangle) {
				x = triangleRelativeRect.left
			}

			// Adjust triangle to be in the center of the content edge.
			else {
				x = w / 2 - halfTriangleWidth
			}

			// Limit to at the intersect edge of content and anchor.
			let minX = Math.max(rect.left, targetRect.left)
			let maxX = Math.min(rect.left + rect.width, targetRect.right)

			// Turn to content rect origin.
			minX -= rect.left
			maxX -= rect.left

			// Turn to triangle left origin.
			minX -= halfTriangleWidth
			maxX -= halfTriangleWidth

			x = Math.max(x, minX)
			x = Math.min(x, maxX)

			if (this.fixTriangle) {
				let translateX = x - triangleRelativeRect.left
				transforms.push(`translateX(${translateX}px)`)
			}
			else {
				x -= DOMUtils.getNumericStyleValue(this.content, 'borderLeftWidth')
				triangle.style.left = x + 'px'
			}

			triangle.style.right = ''
		}

		if (directionMask.left || directionMask.right) {
			let halfTriangleHeight = triangleRelativeRect.height / 2
			let y: number

			if ((h >= targetRect.height || this.fixTriangle)) {
				y = targetRect.top + targetRect.height / 2 - rect.top - halfTriangleHeight
			}
			else if (this.fixTriangle) {
				y = triangleRelativeRect.top
			}
			else {
				y = h / 2 - halfTriangleHeight
			}

			// Limit to at the intersect edge of content and anchor.
			let minY = Math.max(rect.top, targetRect.top)
			let maxY = Math.min(rect.top + rect.height, targetRect.bottom)

			// Turn to content rect origin.
			minY -= rect.top
			maxY -= rect.top

			// Turn to triangle left origin.
			minY -= halfTriangleHeight
			maxY -= halfTriangleHeight

			y = Math.max(y, minY)
			y = Math.min(y, maxY)			

			if (this.fixTriangle) {
				let translateY = y - triangleRelativeRect.top
				transforms.push(`translateY(${translateY}px)`)
			}
			else if (!this.fixTriangle) {
				y -= DOMUtils.getNumericStyleValue(this.content, 'borderTopWidth')
				triangle.style.top = y + 'px'
			}

			triangle.style.bottom = ''
		}
	
		triangle.style.transform = transforms.join(' ')
	}
}


/**
 * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of anchor][X of anchor]`.
 * Shorter type should be `[Touch][Align]` or `[Touch]`.
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align content to the top-center of anchor.
 * E.g.: `tl` is short for `bl-tl`, which means align content to the top-left of anchor.
 * E.g.: `lt` is short for `tr-tl`, which means align content to the left-top of anchor.
 */
function parseAlignDirections(position: string): [Direction, Direction] {
	const PositionDirectionMap: Record<string, Direction> = {
		c: Direction.Center,
		t: Direction.Top,
		b: Direction.Bottom,
		l: Direction.Left,
		r: Direction.Right,
		cc: Direction.Center,
		tl: Direction.TopLeft,
		tr: Direction.TopRight,
		bl: Direction.BottomLeft,
		br: Direction.BottomRight,
	}

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


/** Parse align direction to indicate which direction of anchor element will align to. */
function parseAlignDirectionMask([d1, d2]: [Direction, Direction]): AlignerDirectionMask {

	return {
		top    : d1.isCloseTo(Direction.Bottom) && d2.isCloseTo(Direction.Top),
		right  : d1.isCloseTo(Direction.Left) && d2.isCloseTo(Direction.Right),
		bottom : d1.isCloseTo(Direction.Top) && d2.isCloseTo(Direction.Bottom),
		left   : d1.isCloseTo(Direction.Right) && d2.isCloseTo(Direction.Left),
	}
}


/** Parse margin values to get a margin object, and apply triangle size to it. */
function parseGap(marginValue: number | number[], triangle: HTMLElement | undefined, directionMask: AlignerDirectionMask): BoxDistances {
	let margins = new BoxDistances(...(typeof marginValue === 'number' ? [marginValue] : marginValue))

	if (triangle) {
		if (directionMask.top || directionMask.bottom) {
			margins.top += triangle.offsetHeight
			margins.bottom += triangle.offsetHeight
		}

		if (directionMask.left || directionMask.right) {
			margins.right += triangle.offsetWidth
			margins.left += triangle.offsetWidth
		}
	}

	return margins
}


/** Check if rect box intersect with viewport. */
function getRectBox(el: Element): Box {
	return Box.fromLike(el.getBoundingClientRect())
}


/** Check if rect box intersect with viewport. */
function isRectBoxIntersectWithViewport(rect: Box) {
	let w = document.documentElement.clientWidth
	let h = document.documentElement.clientHeight

	return new Box(0, 0, w, h).isIntersectWith(rect)
}


/** Get a closest ancestral element which has fixed position. */
function getClosestFixedElement(el: Element): HTMLElement | null {
	while (el && el !== document.documentElement) {
		if (getComputedStyle(el).position === 'fixed') {
			break
		}
		el = el.parentElement!
	}

	return el === document.documentElement ? null : el as HTMLElement
}


/** Find first scrolling child element inside. */
function findFirstScrollingDescendance(el: HTMLElement, deep: number = 2): HTMLElement | null {
	if (deep <= 0) {
		return null
	}

	for (let child of el.children) {
		if (child.scrollHeight > child.clientHeight) {
			return child as HTMLElement
		}
	
		let scrollingChild = findFirstScrollingDescendance(child as HTMLElement, deep - 1)
		if (scrollingChild) {
			return scrollingChild
		}
	}

	return null
}
