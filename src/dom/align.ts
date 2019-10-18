import {getStyle} from './css'
import {Rect, getRect} from './node'
import {getClosestFixedElement} from './util'


export interface AlignOptions {

 	/** 
	  * The margin as gaps betweens align element and target, can be a number or a number array composed of 1-4 numbers.
	  * Unique number will only work in main direction.
	  */
	margin?: number | number[]

	/** If true, when el contains high content and should be cutted in viewport, it will be shrinked and with `overflow: y` set. */
	canShrinkInY?: boolean

	/** The trangle element in el, which should set will be adjusted left or top to the middle of the touched place of el and target. */
	trangle?: HTMLElement | undefined

	/** 
	 * Should align trangle in a fixed position.
	 * Default value is `false`, means trangle will be adjusted to be in the center of the edge of el or target.
	 */
	fixTrangle?: boolean
}

/**
 * Align `el` to `target` element by specified position.
 * If no enough space, will adjust align position automatically.
 * Note that this mathod will always cause reflow.
 * @param el The element to align, it's position should be fixed or absolute.
 * @param target The target element to align to.
 * @param position The position that aligning according to, `[Y of el][X of el]-[Y of target][X of target]` or `[Touch][Align]` or `[Touch]`.
 * @param options Additional options.
 */
export function align(el: HTMLElement, target: Element, position: string, options: AlignOptions = {}) {
	new Aligner(el, target, position, options)
}


export class Aligner {

	private el: HTMLElement
	private target: Element
	private trangle: HTMLElement | null
	private trangleRect: Rect | null = null
	private canShrinkInY: boolean
	private position: [string, string]
	private margin: [number, number, number, number]
	private direction: {[key in 'top' | 'right' | 'bottom' | 'left']: boolean}
	private rect: Rect
	private targetRect: Rect
	private fixTrangle: boolean
	private x: number = 0
	private y: number = 0

	constructor(el: HTMLElement, target: Element, position: string, options: AlignOptions = {}) {
		this.el = el
		this.target = target
		this.trangle = options.trangle || null
		this.canShrinkInY = !!options.canShrinkInY
		this.fixTrangle = !!options.fixTrangle

		if (this.trangle) {
			this.trangle.style.transform = ''
			this.trangleRect = this.trangle ? getRect(this.trangle) : null
		}

		this.rect = getRect(this.el)

		this.position = parseAlignPosition(position)
		this.direction = this.getDirections()
		this.margin = this.parseMargin(options.margin || 0)
		this.targetRect = this.getExtendedRect()
	
		if (this.canShrinkInY) {
			this.rect.height = this.getNaturalHeight()
		}

		this.align()
	}

	private align() {
		// If target not affected by document scrolling, el should same
		if (getClosestFixedElement(this.target)) {
			this.el.style.position = 'fixed'
		}

		let anchor1 = this.getElRelativeAnchor()
		let anchor2 = this.getTargetAbsoluteAnchor()

		this.y = anchor2[1] - anchor1[1]
		let overflowYSet = this.alignVertical()

		// If scrollbar appeared, width of el may change
		if (overflowYSet) {
			this.rect = getRect(this.el)
			anchor1 = this.getElRelativeAnchor()
		}

		this.x = anchor2[0] - anchor1[0]
		this.alignHerizontal()

		// Handle trangle position
		if (this.trangle) {
			this.alignTrangle()
		}

		// If is not fixed, minus coordinates relative to offsetParent
		if (getComputedStyle(this.el).position !== 'fixed' && this.target !== document.body && this.target !== document.documentElement) {
			var offsetParent = this.el.offsetParent as HTMLElement

			// If we use body's top postion, it will cause a bug when body has a margin top (even from margin collapse)
			if (offsetParent) {
				var parentRect = offsetParent.getBoundingClientRect()
				this.x -= parentRect.left
				this.y -= parentRect.top
			}
		}

		this.el.style.left = this.x + 'px'
		this.el.style.top = this.y + 'px'
	}

	/** Zero, one or two values be `true`. */
	private getDirections() {
		return {
			top    : this.position[0].includes('b') && this.position[1].includes('t'),
			right  : this.position[0].includes('l') && this.position[1].includes('r'),
			bottom : this.position[0].includes('t') && this.position[1].includes('b'),
			left   : this.position[0].includes('r') && this.position[1].includes('l'),
		}
	}

	/** 
	 * top [right] [bottom] [left] -> [t, r, b, l].
	 * If align to a top position of target, unique number will be parsed as 0 in left and right position. 
	 */
	private parseMargin(marginOption: number | number[]): [number, number, number, number] {
		let margin: number[] = []

		if (typeof marginOption === 'number') {
			margin[0] = this.direction.top || this.direction.bottom ? marginOption : 0
			margin[1] = this.direction.left || this.direction.right ? marginOption : 0
		}
		else {
			margin.push(...marginOption)
		}

		margin[0] = margin[0] || 0
		margin[1] = margin[1] !== undefined ? margin[1] || 0 : margin[0]
		margin[2] = margin[2] !== undefined ? margin[2] || 0 : margin[0]
		margin[3] = margin[3] !== undefined ? margin[3] || 0 : margin[1]

		if (this.trangleRect) {
			if (this.direction.top || this.direction.bottom) {
				margin[0] += this.trangleRect.height
				margin[2] += this.trangleRect.height
			}

			if (this.direction.left || this.direction.right) {
				margin[1] += this.trangleRect.width
				margin[3] += this.trangleRect.width
			}
		}

		return margin as [number, number, number, number]
	}

	private getExtendedRect(): Rect {
		let rect = getRect(this.target)
		rect.top    -= this.margin[0]
		rect.height += this.margin[0] + this.margin[2]
		rect.bottom = rect.top + rect.height
		rect.left   -= this.margin[3]
		rect.width  += this.margin[1] + this.margin[3]
		rect.right  = rect.left + rect.width
		
		return rect
	}

	/** 
	 * When el can be scrolled, if we just expend it to test its natural height, it's scrolled position will lost.
	 * So we get `scrollHeight - clientHeight` as a diff and add it to it's current height as it's natural height.
	 * Note that the `trangle` will cause `scrollHeight` plus for it's height.
	 * Otherwise may not el but child is scrolled.
	 */
	private getNaturalHeight(): number {
		let h = this.rect.height

		let diffHeight = this.el.scrollHeight - this.el.clientHeight
		let maxAllowdDiffWhenNotScrolled = this.trangleRect ? this.trangleRect.height : 0
		
		if (diffHeight <= maxAllowdDiffWhenNotScrolled) {
			diffHeight = Math.max(...[...this.el.children].map(child => child.scrollHeight - child.clientHeight))
		}
		
		if (diffHeight > 0) {
			h = h + diffHeight
		}
		else {
			this.el.style.height = ''
			h = this.el.offsetHeight
		}

		return h
	}

	/** get relative anchor position of the axis of an element. */
	private getElRelativeAnchor(): [number, number] {
		let rect = this.rect
		let anchor = this.position[0]
		let x = anchor.includes('l') ? 0 : anchor.includes('r') ? rect.width : rect.width / 2
		let y = anchor.includes('t') ? 0 : anchor.includes('b') ? rect.height : rect.height / 2

		if (this.fixTrangle && this.trangleRect) {
			if ((this.direction.top || this.direction.bottom) && this.position[1][1] === 'c') {
				x = this.trangleRect.left + this.trangleRect.width / 2 - rect.left
			}
			else if ((this.direction.left || this.direction.right) && this.position[1][0] === 'c') {
				y = this.trangleRect.top + this.trangleRect.height / 2 - rect.top
			}
		}

		return [x, y]
	}

	/** get absolute anchor position in scrolling page */
	private getTargetAbsoluteAnchor(): [number, number] {
		let rect = this.targetRect
		let anchor = this.position[1]
		let x = anchor.includes('l') ? 0 : anchor.includes('r') ? rect.width  : rect.width  / 2
		let y = anchor.includes('t') ? 0 : anchor.includes('b') ? rect.height : rect.height / 2

		x += rect.left
		y += rect.top

		return [x, y]
	}

	private alignVertical(): boolean {
		let dh = document.documentElement.clientHeight
		let spaceTop = this.targetRect.top
		let spaceBottom = dh - this.targetRect.bottom
		let overflowYSet = false
		let h = this.rect.height
		let y = this.y

		if (this.direction.top || this.direction.bottom) {
			if (this.direction.top && y < 0 && spaceTop < spaceBottom) {
				y = this.targetRect.bottom
				this.direction.top = false
				this.direction.bottom = true
			}
			else if (y + h > dh && spaceTop > spaceBottom) {
				y = this.targetRect.top - h
				this.direction.top = true
				this.direction.bottom = false
			}
		}
		else {
			if (y + h > dh) {
				y = dh - h
			}

			if (y < 0) {
				y = 0
			}
		}

		if (y < 0) {
			if (this.direction.top && this.canShrinkInY) {
				y = 0
				this.el.style.height = spaceTop + 'px'
				overflowYSet = true
			}
		}
		else if (this.direction.bottom && y + h > dh) {
			if (this.canShrinkInY) {
				this.el.style.height = spaceBottom + 'px'
				overflowYSet = true
			}
		}

		this.y = y

		return overflowYSet
	}

	private alignHerizontal() {
		let dw = document.documentElement.clientWidth
		let spaceLeft  = this.targetRect.left
		let spaceRight = dw - this.targetRect.right
		let w = this.rect.width
		let x = this.x

		if (this.direction.left || this.direction.right) {
			if (this.direction.left && x < 0 && spaceLeft < spaceRight) {
				x = this.targetRect.right
				this.direction.left = false
				this.direction.right = true
			}
			else if (this.direction.right && x > dw - w && spaceLeft > spaceRight) {
				x = this.targetRect.left - w
				this.direction.left = true
				this.direction.right = false
			}
		}
		else {
			if (x + w > dw) {
				x = dw - w
			}

			if (x < 0) {
				x = 0
			}
		}

		this.x = x
	}

	private alignTrangle() {
		let trangle = this.trangle!
		let rect = this.trangleRect!
		let transforms: string[] = []
		let w = this.rect.width
		let h = this.rect.height

		if (this.direction.top) {
			trangle.style.top = 'auto'
			trangle.style.bottom = -rect.height + 'px'
			transforms.push('rotateX(180deg)')
		}
		else if(this.direction.left) {
			trangle.style.left = 'auto'
			trangle.style.right = -rect.width + 'px'
			transforms.push('rotateY(180deg)')
		}

		if (this.direction.top || this.direction.bottom) {
			let x: number

			// Trangle in the center of the edge of target
			if (w >= this.targetRect.width || this.fixTrangle && this.position[1][1] === 'c') {
				x = this.targetRect.left + this.targetRect.width / 2 - this.x - rect.width / 2
			}
			// Trangle in the center of the edge of el
			else {
				x = w / 2 - rect.width / 2
			}

			if (this.fixTrangle) {
				x -= rect.left - this.rect.left
				transforms.push(`translateX(${x}px)`)
			}
			else {
				trangle.style.left = x + 'px'
			}
		}

		if (this.direction.left || this.direction.right) {
			let y: number

			if (h >= this.targetRect.height || this.fixTrangle && this.position[1][0] === 'c') {
				y = this.targetRect.top + this.targetRect.height / 2 - this.y - rect.height / 2
			}
			else {
				y = h / 2 - rect.height / 2
			}

			if (this.fixTrangle) {
				y -= rect.top - this.rect.top
				transforms.push(`translateY(${y}px)`)
			}
			else {
				trangle.style.top = y + 'px'
			}
		}
	
		trangle.style.transform = transforms.join(' ')
	}
}


/**
 * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of target][X of target]`.
 * Shorter type should be `[Touch][Align]` or `[Touch]`.
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align el to the top-center of target.
 * E.g.: `tl` is short for `bl-tl`, which means align el to the top-left of target.
 * E.g.: `lt` is short for `tr-tl`, which means align el to the left-top of target.
 */
function parseAlignPosition(position: string): [string, string] {
	const ALIGN_POS_OPPOSITE: {[key: string]: string} = {
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

function completeAlignPosition(pos: string): string {
	if (pos.length === 1) {
		pos = 'tb'.includes(pos) ? pos + 'c' : 'c' + pos
	}

	return pos
}


/** 
 * Get main align direction from align position string, can be used to set trangle styles. 
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


/**
 * Align element to a mouse event.
 * @param el A fixed position element to align.
 * @param event A mouse event to align to.
 * @param offset `[x, y]` offset to adjust align position. 
 */
export function alignToEvent(el: HTMLElement, event: MouseEvent, offset: [number, number] = [0, 0]) {
	if (getStyle(el, 'position') !== 'fixed') {
		throw new Error(`Element to call "alignToEvent" must be fixed layout`)
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