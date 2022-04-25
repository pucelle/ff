import {getStyleValue, getStyleValueAsNumber} from './style'
import {Rect, getRect} from './element'
import {isRectCloseTo} from './element'


/** Option for alignment element. */
export interface AlignOptions {

 	/** 
	  * The margin as gaps betweens align element and target,
	  * can be a number or a number array composed of 1-4 numbers.
	  * Unique number will only work in main direction.
	  */
	margin?: number | number[]

	/** 
	 * Whether stick align element to viewport edges.
	 * Such that if align element partly cutted by viewport,
	 * it will be adjusted to become fully visible.
	 * Default value is `true`, you should explicitly set it to `false` to disable.
	 */
	stickToEdges?: boolean

	/** 
	 * Whether can swap align position if spaces in current position is not enough.
	 * Default value is `true`, you should explicitly set it to `false` to disable.
	 */
	canSwapPosition?: boolean

	/** 
	 * If `true`, when `el` contains large content and should be cutted in viewport,
	 * it will be shrinked and reset height.
	 * Note that a child node of `el` must set `overflow-y: auto`.
	 */
	canShrinkInY?: boolean

	/** 
	 * The triangle element in align element,
	 * If provided, will adjust it's left or top position to the center of the intersect edges between `el` and target.
	 */
	triangle?: HTMLElement | undefined

	/** 
	 * Whether should align triangle in a fixed position.
	 * Default value is `false`, means triangle will be adjusted to be in the center of the intersect edges between `el` and `target`.
	 */
	fixTriangle?: boolean
}

/** Align Where of current element to where of the target. */
export type AlignPosition = 't'
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

type Position = {x: number, y: number}
type Directions = Record<'top' | 'right' | 'bottom' | 'left', boolean>
type Margins = Record<'top' | 'right' | 'bottom' | 'left', number>

/**
 * Align `el` to `target` element by specified position.
 * If no enough space, will adjust align position automatically.
 * Note that this mathod will always cause reflow.
 * @param el The element to align, it's position should in fixed or absolute position, otherwise it should not set margin style.
 * @param target The target element to align to.
 * @param alignPosition Align Where of `el` to where of the `target`, e.g., `tl-br` means align top-left position of `el` to bottom-right of `target`.
 * @param options Additional options.
 */
export function align(el: HTMLElement, target: Element, alignPosition: AlignPosition, options: AlignOptions = {}) {
	new Aligner(el, target, alignPosition, options).align()
}


export class Aligner {

	/** Which element to align. */
	private readonly el: HTMLElement

	/** Which element to align beside. */
	private readonly target: Element

	/** Triangle element in `el`. */
	private readonly triangle: HTMLElement | null

	/** Whether stick element to viewport edges when there isn't much space for it. */
	private readonly stickToEdges?: boolean

	/** Whether can swap align position if spaces in current position is not enough. */
	private readonly canSwapPosition?: boolean

	/** 
	 * If not enough space in y axis, whether should shrink height.
	 * When aligning in vertical direction, you should also set `stickToEdges` to `true` to make it work.
	 */
	private readonly canShrinkInY: boolean

	/** Align position, `[anchor of align element, anchor of target element]`. */
	private readonly alignPosition: [string, string]

	/** In which direction to align. */
	private alignDirections: Directions

	/** Margin outside of target element. */
	private readonly margins: Margins

	/** Whether should align triangle element in a fixed position. */
	private readonly fixTriangle: boolean

	/** Whether `el` is fixed position. */
	private isElInFixedPosition: boolean

	private cachedRect: Rect | null = null
	private cachedTargetRect: Rect | null = null

	constructor(el: HTMLElement, target: Element, position: string, options: AlignOptions = {}) {
		this.el = el
		this.target = target
		this.triangle = options.triangle || null
		this.stickToEdges = options.stickToEdges ?? true
		this.canSwapPosition = options.canSwapPosition ?? true
		this.canShrinkInY = options.canShrinkInY ?? false
		this.fixTriangle = options.fixTriangle ?? false

		// Still passed parameters although it's in current project,
		// So we can avoid calling order confuse us.
		this.alignPosition = parseAlignPosition(position)
		this.alignDirections = this.parseAlignDirections()
		this.margins = this.parseMargins(options.margin || 0)

		// If `target` is not affected by document scrolling, `el` should be same.
		// A potential problem here: once becomes fixed, can't be restored for reuseable popups.
		if (getClosestFixedElement(this.target)) {
			this.el.style.position = 'fixed'
			this.isElInFixedPosition = true
		}
		else {
			this.isElInFixedPosition = getComputedStyle(this.el).position === 'fixed'
		}
	}

	/** Parse align direction to indicate which direction will align to. */
	private parseAlignDirections(): Directions {
		let alignPosition = this.alignPosition

		return {
			top    : alignPosition[0].includes('b') && alignPosition[1].includes('t'),
			right  : alignPosition[0].includes('l') && alignPosition[1].includes('r'),
			bottom : alignPosition[0].includes('t') && alignPosition[1].includes('b'),
			left   : alignPosition[0].includes('r') && alignPosition[1].includes('l'),
		}
	}

	/** 
	 * top [right] [bottom] [left] -> [t, r, b, l].
	 * If align to a top position of target, unique number will be parsed as 0 in left and right position. 
	 */
	private parseMargins(marginOption: number | number[]): Margins {
		let margins: Margins = {top: 0, right: 0, bottom: 0, left: 0}

		if (typeof marginOption === 'number') {
			margins.top = marginOption
			margins.right = marginOption
			margins.bottom = marginOption
			margins.left = marginOption
		}
		else {
			margins.top = marginOption[0]
			margins.right = marginOption[1] ?? margins.top
			margins.bottom = marginOption[2] ?? margins.top
			margins.left = marginOption[3] ?? margins.right
		}

		if (this.triangle) {
			if (this.alignDirections.top || this.alignDirections.bottom) {
				margins.top += this.triangle.offsetHeight
				margins.bottom += this.triangle.offsetHeight
			}

			if (this.alignDirections.left || this.alignDirections.right) {
				margins.right += this.triangle.offsetWidth
				margins.left += this.triangle.offsetWidth
			}
		}

		return margins
	}

	/** 
	 * Align `el` to beside `target` element.
	 * Returns whether does alignment.
	 */
	align(): boolean {
		this.resetStylesBeforeGettingRect()

		let directions = {...this.alignDirections}
		let rect = getRect(this.el)
		let targetRect = getRect(this.target)

		if (this.cachedRect && isRectCloseTo(rect, this.cachedRect)
			&& this.cachedTargetRect && isRectCloseTo(targetRect, this.cachedTargetRect)
		) {
			return true
		}

		// Whether `target` is visible.
		if (!isRectVisible(targetRect)) {
			return false
		}

		// Whether `target` in viewport.
		let targetInViewport = isRectIntersectWithViewport(targetRect)
		let willAlign = targetInViewport || !this.stickToEdges
		if (!willAlign) {
			return false
		}

		// `el` may be shrinked into the edge and it's width get limited.
		if (this.shouldClearElPosition(rect)) {
			this.clearElPosition()
			rect = getRect(this.el)
		}

		// Get triangle rect based on `el` origin.
		let triangleRelativeRect = this.getTriangleRelativeRect(rect)

		// Restore `el` height to it's natural height without any limitation.
		if (this.canShrinkInY) {
			let willShrinkElement = findFirstScrollingChild(this.el)
			if (willShrinkElement) {
				rect.height += willShrinkElement.scrollHeight - willShrinkElement.clientHeight
			}
		}

		// Do `el` alignment.
		this.doAlignment(directions, rect, targetRect, triangleRelativeRect)

		// Handle `triangle` position.
		if (this.triangle) {
			this.alignTriangle(directions, rect, targetRect, triangleRelativeRect!)
		}

		this.cachedRect = rect
		this.cachedTargetRect = targetRect
	
		return true
	}

	/** Set some styles before alignment. */
	private resetStylesBeforeGettingRect() {
		
		// Avoid it's height cause body scrollbar appears.
		if (this.canShrinkInY && this.el.offsetHeight > document.documentElement.clientHeight) {
			this.el.style.height = '100vh'
		}
	}

	/** Should clear last alignment properties. */
	private shouldClearElPosition(rect: Rect) {

		// If rect of `el` close to window edge, it's width may be limited.
		return rect.left <= 0 || rect.right >= document.documentElement.clientWidth
	}

	/** Clear last alignment properties. */
	private clearElPosition() {
		this.el.style.left = '0'
		this.el.style.right = ''
		this.el.style.top = '0'
	}

	/** Get triangle rect based on `el` origin. */
	private getTriangleRelativeRect(rect: Rect) {
		// `align` may be called for multiple times, so need to clear again.
		if (this.fixTriangle && this.triangle) {
			this.triangle.style.transform = ''
		}

		let relativeTriangleRect = this.triangle ? getRect(this.triangle) : null
		if (relativeTriangleRect) {
			relativeTriangleRect.left -= rect.left
			relativeTriangleRect.top -= rect.top
		}

		return relativeTriangleRect
	}

	/** 
	 * Do alignment from `el` to `target` for once.
	 * Overwrite the new alignment position into `rect`.
	 */
	private doAlignment(directions: Directions, rect: Rect, targetRect: Rect, triangleRelativeRect: Rect | null) {
		let anchor1 = this.getElRelativeAnchor(directions, rect, triangleRelativeRect)
		let anchor2 = this.getTargetAbsoluteAnchor(targetRect)

		// Fixed `el` position.
		let fixedPosition: Position = {
			x: anchor2[0] - anchor1[0],
			y: anchor2[1] - anchor1[1],
		}

		// Handle vertical alignment.
		let overflowYSet = this.alignVertical(fixedPosition.y, directions, rect, targetRect, triangleRelativeRect)

		// If `el` height changed.
		if (overflowYSet) {
			anchor1 = this.getElRelativeAnchor(directions, rect, triangleRelativeRect)
			fixedPosition.x = anchor2[0] - anchor1[0]
			fixedPosition.y = anchor2[1] - anchor1[1]
		}

		// Handle herizontal alignment.
		this.alignHerizontal(fixedPosition.x, directions, rect, targetRect, triangleRelativeRect)

		// If is not fixed, minus coordinates relative to offsetParent.
		if (!this.isElInFixedPosition && this.target !== document.body && this.target !== document.documentElement) {
			var offsetParent = this.el.offsetParent as HTMLElement

			// If we use body's top postion, it will cause a bug when body has a margin top (even from margin collapse).
			if (offsetParent) {
				var parentRect = offsetParent.getBoundingClientRect()
				rect.left -= parentRect.left
				rect.top -= parentRect.top
			}

			rect.right = rect.left + rect.width
			rect.bottom = rect.top + rect.height
		}

		// May scrollbar appears after alignment,
		// such that it should align to right.
		if (directions.left) {
			this.el.style.left = 'auto'
			this.el.style.right = document.documentElement.clientWidth - rect.right + 'px'
		}
		else {
			this.el.style.left = rect.left + 'px'
			this.el.style.right = 'auto'
		}

		this.el.style.top = rect.top + 'px'
	}

	/** Get relative anchor position of the axis of an element. */
	private getElRelativeAnchor(directions: Directions, rect: Rect, triangleRelativeRect: Rect | null): [number, number] {
		let anchor = this.alignPosition[0]
		let x = anchor.includes('l') ? 0 : anchor.includes('r') ? rect.width : rect.width / 2
		let y = anchor.includes('t') ? 0 : anchor.includes('b') ? rect.height : rect.height / 2

		// Anchor at triangle position.
		if (this.fixTriangle && triangleRelativeRect) {
			if ((directions.top || directions.bottom) && this.alignPosition[1][1] === 'c') {
				x = triangleRelativeRect.left + triangleRelativeRect.width / 2
			}
			else if ((directions.left || directions.right) && this.alignPosition[1][0] === 'c') {
				y = triangleRelativeRect.top + triangleRelativeRect.height / 2
			}
		}

		return [x, y]
	}

	/** Get absolute anchor position in scrolling page. */
	private getTargetAbsoluteAnchor(targetRect: Rect): [number, number] {
		let anchor = this.alignPosition[1]

		let x = anchor.includes('l')
			? targetRect.left - this.margins.left
			: anchor.includes('r')
			? targetRect.right + this.margins.right
			: targetRect.left + targetRect.width  / 2

		let y = anchor.includes('t')
			? targetRect.top - this.margins.top
			: anchor.includes('b')
			? targetRect.bottom + this.margins.bottom
			: targetRect.top + targetRect.height  / 2

		return [x, y]
	}

	/** Do vertical alignment. */
	private alignVertical(y: number, directions: Directions, rect: Rect, targetRect: Rect, triangleRelativeRect: Rect | null): boolean {
		let dh = document.documentElement.clientHeight
		let spaceTop = targetRect.top - this.margins.top
		let spaceBottom = dh - (targetRect.bottom + this.margins.bottom)
		let overflowYSet = false
		let h = rect.height

		if (directions.top || directions.bottom) {

			// Not enough space in top position, switch to bottom.
			if (directions.top && y < 0 && spaceTop < spaceBottom && this.canSwapPosition) {
				y = targetRect.bottom + this.margins.bottom
				directions.top = false
				directions.bottom = true
			}

			// Not enough space in bottom position, switch to top.
			else if (y + h > dh && spaceTop > spaceBottom && this.canSwapPosition) {
				y = targetRect.top - this.margins.top - h
				directions.top = true
				directions.bottom = false
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
			// Shrink element height if not enough space.
			if (directions.top && y < 0 && this.stickToEdges) {
				y = 0
				h = spaceTop
				overflowYSet = true
			}
			else if (directions.bottom && y + h > dh && this.stickToEdges) {
				h = spaceBottom
				overflowYSet = true
			}
			else if (!directions.top && !directions.bottom && rect.height > dh) {
				y = 0
				h = dh
				overflowYSet = true
			}
		}

		// Process stick to edges.
		else if (this.stickToEdges) {
			if (directions.top || directions.bottom) {
				y = Math.min(y, dh - rect.height)
				y = Math.max(0, y)
			}
		}

		rect.top = y

		if (overflowYSet) {
			this.el.style.height = h + 'px'
			rect.height = h
		}

		rect.bottom = rect.top + rect.height

		return overflowYSet
	}

	/** Do herizontal alignment. */
	private alignHerizontal(x: number, directions: Directions, rect: Rect, targetRect: Rect, triangleRelativeRect: Rect | null) {
		let dw = document.documentElement.clientWidth
		let spaceLeft = targetRect.left - this.margins.left
		let spaceRight = dw - (targetRect.right + this.margins.right)
		let w = rect.width

		if (directions.left || directions.right) {

			// Not enough space in left position.
			if (directions.left && x < 0 && spaceLeft < spaceRight && this.canSwapPosition) {
				x = targetRect.right + this.margins.right
				directions.left = false
				directions.right = true
			}

			// Not enough space in right position.
			else if (directions.right && x > dw - w && spaceLeft > spaceRight && this.canSwapPosition) {
				x = targetRect.left - this.margins.left - w
				directions.left = true
				directions.right = false
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

		// Process stick to edges.
		if (this.stickToEdges) {
			if (directions.left || directions.right) {
				x = Math.min(x, dw - rect.width)
				x = Math.max(0, x)
			}
		}

		rect.left = x
		rect.right = rect.left + rect.width
	}

	/** Align `triangle` relative to `el`. */
	private alignTriangle(directions: Directions, rect: Rect, targetRect: Rect, triangleRelativeRect: Rect) {
		let triangle = this.triangle!
		let transforms: string[] = []
		let w = rect.width
		let h = rect.height

		if (directions.top) {
			triangle.style.top = 'auto'
			triangle.style.bottom = -triangleRelativeRect.height + 'px'
			transforms.push('rotateX(180deg)')
		}
		else if (directions.bottom) {
			triangle.style.top = -triangleRelativeRect.height + 'px'
			triangle.style.bottom = ''
		}
		else if (directions.left) {
			triangle.style.left = 'auto'
			triangle.style.right = -triangleRelativeRect.width + 'px'
			transforms.push('rotateY(180deg)')
		}
		else if (directions.right) {
			triangle.style.left = -triangleRelativeRect.width + 'px'
			triangle.style.right = ''
		}

		if (directions.top || directions.bottom) {
			let halfTriangleWidth = triangleRelativeRect.width / 2
			let x: number = 0

			// Adjust triangle to the center of the `target` edge.
			if ((w >= targetRect.width || this.fixTriangle) && this.alignPosition[1][1] === 'c') {
				x = targetRect.left + targetRect.width / 2 - rect.left - halfTriangleWidth
			}

			// In fixed position.
			else if (this.fixTriangle) {
				x = triangleRelativeRect.left
			}

			// Adjust triangle to the center of the `el` edge.
			else {
				x = w / 2 - halfTriangleWidth
			}

			// Limit to at the intersect edge of `el` and target.
			let minX = Math.max(rect.left, targetRect.left)
			let maxX = Math.min(rect.left + rect.width, targetRect.right)

			// Turn to `el` rect origin.
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
				x -= getStyleValueAsNumber(this.el, 'borderLeftWidth')
				triangle.style.left = x + 'px'
			}

			triangle.style.right = ''
		}

		if (directions.left || directions.right) {
			let halfTriangleHeight = triangleRelativeRect.height / 2
			let y: number

			if ((h >= targetRect.height || this.fixTriangle) && this.alignPosition[1][0] === 'c') {
				y = targetRect.top + targetRect.height / 2 - rect.top - halfTriangleHeight
			}
			else if (this.fixTriangle) {
				y = triangleRelativeRect.top
			}
			else {
				y = h / 2 - halfTriangleHeight
			}

			// Limit to at the intersect edge of `el` and target.
			let minY = Math.max(rect.top, targetRect.top)
			let maxY = Math.min(rect.top + rect.height, targetRect.bottom)

			// Turn to `el` rect origin.
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
				y -= getStyleValueAsNumber(this.el, 'borderTopWidth')
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
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align `el` to the top-center of target.
 * E.g.: `tl` is short for `bl-tl`, which means align `el` to the top-left of target.
 * E.g.: `lt` is short for `tr-tl`, which means align `el` to the left-top of target.
 */
function parseAlignPosition(position: string): [string, string] {
	const ALIGN_POS_OPPOSITE: Record<string, string> = {
		t: 'b',
		b: 't',
		c: 'c',
		l: 'r',
		r: 'l',
	}

	if (!/^(?:[tbc][lrc]-[tbc][lrc]|[tbclr]-[tbclr]|[tbc][lrc]|[tbclr])/.test(position)) {
		throw `"${position}" is not a valid position`
	}

	if (position.length === 1) {
		// t -> bc-tc
		if ('tb'.includes(position)) {
			position = ALIGN_POS_OPPOSITE[position] + 'c-' + position + 'c'
		}

		// l -> cr-cl
		// c -> cc-cc
		else {
			position = 'c' + ALIGN_POS_OPPOSITE[position] + '-c' + position
		}
	}
	else if (position.length === 2) {
		// tl -> bl-tl
		if ('tb'.includes(position[0])) {
			position = ALIGN_POS_OPPOSITE[position[0]] + position[1] + '-' + position
		}

		// lt -> tr-tl
		else {
			position = position[1] + ALIGN_POS_OPPOSITE[position[0]] + '-' + position[1] + position[0]
		}
	}

	let posArray = position.split('-')
	return [completeAlignPosition(posArray[0]), completeAlignPosition(posArray[1])]
}


/** Complete align position from one char to two, e.g., `t-b` -> `tc-bc`. */
function completeAlignPosition(pos: string): string {
	if (pos.length === 1) {
		pos = 'tb'.includes(pos) ? pos + 'c' : 'c' + pos
	}

	return pos
}


/** 
 * Get main align direction from align position string, can be used to set triangle styles. 
 * @param pos Align position like `t`, `tc`, `bc-tc`.
 */
export function getMainAlignDirection(pos: string): 't' | 'b' | 'l' | 'r' | 'c' | '' {
	let position = pos.length < 5 ? parseAlignPosition(pos) : pos

	if (position[0].includes('b') && position[1].includes('t')) {
		return 't'
	}
	else if (position[0].includes('l') && position[1].includes('r')) {
		return 'r'
	}
	else if (position[0].includes('t') && position[1].includes('b')) {
		return 'b'
	}
	else if (position[0].includes('r') && position[1].includes('l')) {
		return 'l'
	}
	else if (position[0] === 'cc' && position[1] === 'cc') {
		return 'c'
	}
	else {
		return ''
	}
}


/** Check if rect box intersect with viewport. */
function isRectVisible(rect: Rect) {
	return rect.width > 0 || rect.height > 0
}


/** Check if rect box intersect with viewport. */
function isRectIntersectWithViewport(rect: Rect) {
	let w = document.documentElement.clientWidth
	let h = document.documentElement.clientHeight

	return rect.left < w && rect.right > 0 && rect.top < h && rect.bottom > 0 
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


/** Get first scrolling child element inside. */
function findFirstScrollingChild(el: HTMLElement, deep: number = 2): HTMLElement | null {
	if (deep <= 0) {
		return null
	}

	for (let child of el.children) {
		if (child.scrollHeight > child.clientHeight) {
			return child as HTMLElement
		}
	
		let scrollingChild = findFirstScrollingChild(child as HTMLElement, deep - 1)
		if (scrollingChild) {
			return scrollingChild
		}
	}

	return null
}


/**
 * Align element to a mouse event.
 * @param el A fixed position element to align.
 * @param event A mouse event to align to.
 * @param offset `[x, y]` offset relative to current mouse position. 
 */
export function alignToEvent(el: HTMLElement, event: MouseEvent, offset: [number, number] = [0, 0]) {
	if (getStyleValue(el, 'position') !== 'fixed') {
		throw new Error(`Element to call "alignToEvent" must in fixed layout`)
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