import {Box, Direction, BoxEdgeDistances, Point} from '../math'
import {DOMUtils} from '../utils'


/** Options for aligning two elements. */
export interface AlignerOptions {

 	/** 
	  * The margin as gaps betweens `to-align` element and `target` element.
	  * It equals expanding `target` element area with this value.
	  * can be a number or a number array composed of 1-4 numbers, in `top right? bottom? left?` order.
	  */
	margin?: number | number[]

	/** 
	 * Whether stick `to-align` element to viewport edges.
	 * Such that if `to-align` element partly cutted by viewport,
	 * it will be adjusted to stick viewport edges and become fully visible.
	 * Default value is `true`, set it to `false` to disable.
	 */
	stickToEdges?: boolean

	/** 
	 * Whether can swap `to-align` position if spaces in specified position is not enough.
	 * Default value is `true`, set it to `false` to disable.
	 */
	canSwapPosition?: boolean

	/** 
	 * If `true`, when `to-align` element contains large content and should be cutted in viewport,
	 * it will be shrinked by limiting height.
	 * Note that a descentant element inside `to-align` element must set `overflow-y: auto`.
	 */
	canShrinkInY?: boolean

	/** 
	 * Whether should align triangle in a fixed position.
	 * Default value is `false`, means triangle element will be anchored to be in the center of the intersect edges between `to-align` and `target` element.
	 */
	fixTriangle?: boolean
	
	/** 
	 * The triangle element inside `to-align` element,
	 * If provided, will adjust it's left or top position,
	 * to anchor it to be in the center of the intersect edges between `to-align` and `target` element.
	 */
	triangle?: HTMLElement
}

/** Align where of `align-to` element to where of the `target` element. */
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

type AlignerDirectionMask = Record<BoxEdgeDistanceKey, boolean>


const DefaultAlignerOptions: Omit<Required<AlignerOptions>, 'triangle' | 'margin'> = {
	stickToEdges: true,
	canSwapPosition: true,
	canShrinkInY: false,
	fixTriangle: false,
}

export class Aligner implements Omit<AlignerOptions, 'margin'> {
	
	/**
	 * Align `to-align` to `target` element with specified position.
	 * If no enough space, will adjust align position automatically.
	 * `alignPosition`: contains two parts, e.g., `tl-br` means align top-left position of `to-align` to bottom-right position of `target`.
	 */
	static align(toAlign: HTMLElement, target: Element, alignPosition: AlignerPosition, options: AlignerOptions = {}) {
		new Aligner(toAlign, target, alignPosition, options).align()
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
	 * to indicate which direction to align `to-align` element relative to `target` element.
	 */
	static getMainAlignDirection(position: string): Direction {
		let [d1, d2] = parseAlignDirections(position)
		return d1.opposite.joinWith(d2)
	}


	readonly stickToEdges!: boolean
	readonly canSwapPosition!: boolean
	readonly canShrinkInY!: boolean
	readonly fixTriangle!: boolean
	readonly triangle!: HTMLElement | undefined

	/** The element to align. */
	private readonly toAlign: HTMLElement

	/** Target target element to align beside. */
	private readonly target: Element

	/** Directions of `to-align` and `target` elements. */
	private readonly directions: [Direction, Direction]

	/** In which direction of `target` element will be aligned. */
	private readonly directionMask: AlignerDirectionMask

	/** Margin outside of `target` element. */
	private readonly margins: BoxEdgeDistances

	/** Whether `to-align` element use fixed alignment position. */
	private readonly useFixedAlignment: boolean

	private cachedRect: Box | null = null
	private cachedTargetRect: Box | null = null

	constructor(el: HTMLElement, target: Element, position: string, options: AlignerOptions = {}) {
		this.toAlign = el
		this.target = target
		Object.assign(this, DefaultAlignerOptions, options)

		this.directions = parseAlignDirections(position)
		this.directionMask = parseAlignDirectionMask(this.directions)
		this.margins = parseMargins(options.margin || 0, this.triangle, this.directionMask)

		// If `target` element is not affected by document scrolling, `to-align` element should be the same.
		// A potential problem here: once becomes fixed, can't be restored for reuseable popups.
		if (getClosestFixedElement(this.target)) {
			this.toAlign.style.position = 'fixed'
			this.useFixedAlignment = true
		}
		else {
			this.useFixedAlignment = getComputedStyle(this.toAlign).position === 'fixed'
		}
	}

	/** 
	 * Align `to-align` to beside `target` element.
	 * Returns whether did alignment.
	 */
	align(): boolean {
		this.resetToAlignStyles()

		let directionMask = {...this.directionMask}
		let rect = getRect(this.toAlign)
		let targetRect = getRect(this.target)

		// Both rects are not changed.
		if (this.cachedRect?.equals(rect) && this.cachedTargetRect?.equals(targetRect)) {
			return true
		}

		// If `target` is not visible.
		if (targetRect.empty) {
			return false
		}

		// Whether `target` in viewport.
		let targetInViewport = isRectIntersectWithViewport(targetRect)
		let willAlign = targetInViewport || !this.stickToEdges
		if (!willAlign) {
			return false
		}

		// `to-align` may be shrinked into the edge and it's width get limited.
		if (this.shouldClearToAlignPosition(rect)) {
			this.clearToAlignPosition()
			rect = getRect(this.toAlign)
		}

		// Get triangle rect based on `to-align` origin.
		let triangleRelativeRect = this.getTriangleRelativeRect(rect)

		// Restore `to-align` element height to it's natural height without any limitation.
		if (this.canShrinkInY) {
			let willShrinkElement = findFirstScrollingDescendance(this.toAlign)
			if (willShrinkElement) {
				rect.height += willShrinkElement.scrollHeight - willShrinkElement.clientHeight
			}
		}

		// Do `to-align` alignment.
		this.doAlignment(directionMask, rect, targetRect, triangleRelativeRect)

		// Handle `triangle` position.
		if (this.triangle) {
			this.alignTriangle(directionMask, rect, targetRect, triangleRelativeRect!)
		}

		this.cachedRect = rect
		this.cachedTargetRect = targetRect
	
		return true
	}

	/** Set some styles of `to-align` element before doing alignment. */
	private resetToAlignStyles() {
		
		// Avoid it's height cause body scrollbar appears.
		if (this.canShrinkInY && this.toAlign.offsetHeight > document.documentElement.clientHeight) {
			this.toAlign.style.height = '100vh'
		}
		else if (this.canShrinkInY && this.toAlign.style.height) {
			this.toAlign.style.height = ''
		}
	}

	/** Should clear last alignment properties, to avoid it's position affect it's size. */
	private shouldClearToAlignPosition(rect: Box) {

		// If rect of `to-align` close to window edge, it's width may be limited.
		return rect.left <= 0 || rect.right >= document.documentElement.clientWidth
	}

	/** Clear last alignment properties. */
	private clearToAlignPosition() {
		this.toAlign.style.left = '0'
		this.toAlign.style.right = ''
		this.toAlign.style.top = '0'
	}

	/** Get triangle rect based on `to-align` element origin. */
	private getTriangleRelativeRect(rect: Box): Box | null {

		// `align` may be called for multiple times, so need to clear again.
		if (this.fixTriangle && this.triangle) {
			this.triangle.style.transform = ''
		}

		let relativeTriangleRect = this.triangle ? getRect(this.triangle) : null
		if (relativeTriangleRect) {
			relativeTriangleRect.translateSelf(-rect.x, -rect.y)
		}

		return relativeTriangleRect
	}

	/** 
	 * Do alignment from `to-align` to `target` for once.
	 * Overwrite the new alignment position into `rect`.
	 */
	private doAlignment(directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box | null) {
		let anchor1 = this.getToAlignRelativeAnchorPoint(directionMask, rect, triangleRelativeRect)
		let anchor2 = this.getTargetAbsoluteAnchorPoint(targetRect)

		// Fixed `to-align` element position.
		let fixedPosition = anchor2.diff(anchor1)

		// Handle vertical alignment.
		let overflowYSet = this.alignVertical(fixedPosition.y, directionMask, rect, targetRect, triangleRelativeRect)

		// If `to-align` element's height changed.
		if (overflowYSet) {
			anchor1 = this.getToAlignRelativeAnchorPoint(directionMask, rect, triangleRelativeRect)
			fixedPosition = anchor2.diff(anchor1)
		}

		// Handle herizontal alignment, `rect` will be modified.
		this.alignHorizontal(fixedPosition.x, directionMask, rect, targetRect, triangleRelativeRect)

		// The fixed coordinate of `to-align` currently.
		let x = rect.x
		let y = rect.y

		// For absolute layout `to-align`, convert x, y to absolute coordinate.
		if (!this.useFixedAlignment && this.target !== document.body && this.target !== document.documentElement) {
			var offsetParent = this.toAlign.offsetParent as HTMLElement

			// If we use body's top postion, it will cause a bug when body has a margin top (even from margin collapse).
			if (offsetParent) {
				var parentRect = offsetParent.getBoundingClientRect()
				x -= parentRect.left
				y -= parentRect.top
			}
		}

		// May scrollbar appears after alignment,
		// such that it should align to right.
		if (directionMask.left) {
			this.toAlign.style.left = 'auto'
			this.toAlign.style.right = document.documentElement.clientWidth - rect.right + 'px'
		}
		else {
			this.toAlign.style.left = x + 'px'
			this.toAlign.style.right = 'auto'
		}

		this.toAlign.style.top = y + 'px'
	}

	/** Get relative anchor position of the axis of `to-align` element. */
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

	/** Get absolute anchor position of `target` element in scrolling page. */
	private getTargetAbsoluteAnchorPoint(targetRect: Box): Point {
		let [, d2] = this.directions
		let point = targetRect.anchorPointAt(d2)

		return point
	}

	/** Do vertical alignment. */
	private alignVertical(y: number, directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box | null): boolean {
		let dh = document.documentElement.clientHeight
		let spaceTop = targetRect.top - this.margins.top
		let spaceBottom = dh - (targetRect.bottom + this.margins.bottom)
		let overflowYSet = false
		let h = rect.height

		if (directionMask.top || directionMask.bottom) {

			// Not enough space at top side, switch to bottom.
			if (directionMask.top && y < 0 && spaceTop < spaceBottom && this.canSwapPosition) {
				y = targetRect.bottom + this.margins.bottom
				directionMask.top = false
				directionMask.bottom = true
			}

			// Not enough space at bottom side, switch to top.
			else if (y + h > dh && spaceTop > spaceBottom && this.canSwapPosition) {
				y = targetRect.top - this.margins.top - h
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

		if (this.canShrinkInY) {

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
			this.toAlign.style.height = h + 'px'
			rect.height = h
		}

		return overflowYSet
	}

	/** Do herizontal alignment. */
	private alignHorizontal(x: number, directionMask: AlignerDirectionMask, rect: Box, targetRect: Box, triangleRelativeRect: Box | null) {
		let dw = document.documentElement.clientWidth
		let spaceLeft = targetRect.left - this.margins.left
		let spaceRight = dw - (targetRect.right + this.margins.right)
		let w = rect.width

		if (directionMask.left || directionMask.right) {

			// Not enough space at left side.
			if (directionMask.left && x < 0 && spaceLeft < spaceRight && this.canSwapPosition) {
				x = targetRect.right + this.margins.right
				directionMask.left = false
				directionMask.right = true
			}

			// Not enough space at right side.
			else if (directionMask.right && x > dw - w && spaceLeft > spaceRight && this.canSwapPosition) {
				x = targetRect.left - this.margins.left - w
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

	/** Align `triangle` relative to `to-align` element. */
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

			// Adjust triangle to be in the center of the `target` edge.
			if ((w >= targetRect.width || this.fixTriangle)) {
				x = targetRect.left + targetRect.width / 2 - rect.left - halfTriangleWidth
			}

			// In fixed position.
			else if (this.fixTriangle) {
				x = triangleRelativeRect.left
			}

			// Adjust triangle to be in the center of the `to-align` edge.
			else {
				x = w / 2 - halfTriangleWidth
			}

			// Limit to at the intersect edge of `to-align` and `target`.
			let minX = Math.max(rect.left, targetRect.left)
			let maxX = Math.min(rect.left + rect.width, targetRect.right)

			// Turn to `to-align` rect origin.
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
				x -= DOMUtils.getStyleValueAsNumber(this.toAlign, 'borderLeftWidth')
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

			// Limit to at the intersect edge of `to-align` and `target`.
			let minY = Math.max(rect.top, targetRect.top)
			let maxY = Math.min(rect.top + rect.height, targetRect.bottom)

			// Turn to `to-align` rect origin.
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
				y -= DOMUtils.getStyleValueAsNumber(this.toAlign, 'borderTopWidth')
				triangle.style.top = y + 'px'
			}

			triangle.style.bottom = ''
		}
	
		triangle.style.transform = transforms.join(' ')
	}
}


/**
 * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of target][X of target]`.
 * Shorter type should be `[Touch][Align]` or `[Touch]`.
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align `to-align` to the top-center of `target`.
 * E.g.: `tl` is short for `bl-tl`, which means align `to-align` to the top-left of `target`.
 * E.g.: `lt` is short for `tr-tl`, which means align `to-align` to the left-top of `target`.
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


/** Parse align direction to indicate which direction of `target` element will align to. */
function parseAlignDirectionMask([d1, d2]: [Direction, Direction]): AlignerDirectionMask {

	return {
		top    : d1.isCloseTo(Direction.Bottom) && d2.isCloseTo(Direction.Top),
		right  : d1.isCloseTo(Direction.Left) && d2.isCloseTo(Direction.Right),
		bottom : d1.isCloseTo(Direction.Top) && d2.isCloseTo(Direction.Bottom),
		left   : d1.isCloseTo(Direction.Right) && d2.isCloseTo(Direction.Left),
	}
}


/** Parse margin values to get a margin object, and apply triangle size to it. */
function parseMargins(marginValue: number | number[], triangle: HTMLElement | undefined, directionMask: AlignerDirectionMask): BoxEdgeDistances {
	let margins = new BoxEdgeDistances(...(typeof marginValue === 'number' ? [marginValue] : marginValue))

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
function getRect(el: Element): Box {
	return Box.fromLike(el.getBoundingClientRect())
}


/** Check if rect box intersect with viewport. */
function isRectIntersectWithViewport(rect: Box) {
	let w = document.documentElement.clientWidth
	let h = document.documentElement.clientHeight

	return new Box(0, 0, w, h).isIntersectWith(rect)
}


/** Get a closest ancest element which has fixed position. */
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
