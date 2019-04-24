import {getNumeric, setStyle, getStyle} from './css'
import {Rect, getRect} from './node'
import {getClosestFixedElement} from './util'


export interface AlignOptions {

 	/** The margin as gap betweens el and target. can be a number or string composed of 1-4 numbers. */
	margin?: number | number[]

	/** If true, when el contains high content and should be cutted in viewport, it will be shrinked and with `overflow: y` set. */
	canShrinkInY?: boolean

	/** The trangle element in el, which should set will be adjusted left or top to the middle of the touched place of el and target. */
	trangle?: HTMLElement | undefined
}

/**
 * Align element to target element by specified position.
 * Note that this mathod will always cause reflow.
 * @param el The element to align, it's position should be fixed or absolute.
 * @param target The target element to align to.
 * @param position The position that aligning according to, `[Y of el][X of el]-[Y of target][X of target]` or `[Touch][Align]` or `[Touch]`.
 * @param options Additional options.
 */
export function align(el: HTMLElement, target: HTMLElement, position: string, options: AlignOptions = {}) {
	new Aligner(el, target, position, options)
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


/** Used to get main align direction from align position string and then set trangle styles. */
export function getAlignDirection(pos: string): 't' | 'b' | 'l' | 'r' | 'c' | '' {
	let position = parseAlignPosition(pos)

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


export class Aligner {

	private el: HTMLElement
	private target: HTMLElement
	private trangle: HTMLElement | null
	private position: [string, string]
	private margin: [number, number, number, number]
	private direction: {[key in 'top' | 'right' | 'bottom' | 'left']: boolean}
	private targetRect: Rect
	private canShrinkInY: boolean
	private w: number
	private h: number
	private x: number = 0
	private y: number = 0

	constructor(el: HTMLElement, target: HTMLElement, position: string, options: AlignOptions = {}) {
		this.el = el
		this.target = target
		this.trangle = options.trangle || null
		this.position = parseAlignPosition(position)
		this.canShrinkInY = !!options.canShrinkInY
		this.direction = this.getDirections()
		this.margin = this.parseMargin(options.margin || 0)
		this.targetRect = this.getExtendedRect()
		this.w  = this.el.offsetWidth

		if (this.canShrinkInY) {
			this.h = this.getNaturalHeight()
		}
		else {
			this.h  = this.el.offsetHeight
		}

		this.align()
	}

	align() {
		if (getClosestFixedElement(this.target)) {
			setStyle(this.el, 'position', 'fixed')
		}

		let anchor1 = this.getFixedAnchor(this.w, this.h, this.position[0])
		let anchor2 = this.getAbsoluteAnchor(this.targetRect, this.position[1])

		this.y = anchor2[1] - anchor1[1]
		let overflowYSet = this.alignVertical()

		// If scrollbar appeared, width of el may change
		if (overflowYSet) {
			this.w = this.el.offsetWidth
			anchor1 = this.getFixedAnchor(this.w, this.h, this.position[0])
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

		setStyle(this.el, {
			left: Math.round(this.x),
			top:  Math.round(this.y),
		})
	}

	getDirections() {
		return {
			top    : this.position[0].includes('b') && this.position[1].includes('t'),
			right  : this.position[0].includes('l') && this.position[1].includes('r'),
			bottom : this.position[0].includes('t') && this.position[1].includes('b'),
			left   : this.position[0].includes('r') && this.position[1].includes('l'),
		}
	}

	/** top [right] [bottom] [left] -> [t, r, b, l]. */
	parseMargin(margin: number | number[]): [number, number, number, number] {
		if (typeof margin === 'number') {
			margin = [margin]
		}

		margin[0] = margin[0] || 0
		margin[1] = margin[1] !== undefined ? margin[1] || 0 : margin[0]
		margin[2] = margin[2] !== undefined ? margin[2] || 0 : margin[0]
		margin[3] = margin[3] !== undefined ? margin[3] || 0 : margin[1]

		if (this.trangle) {
			if (this.direction.top || this.direction.bottom) {
				margin[0] += this.trangle.offsetHeight
				margin[2] += this.trangle.offsetHeight
			}

			if (this.direction.left || this.direction.right) {
				margin[1] += this.trangle.offsetWidth
				margin[3] += this.trangle.offsetWidth
			}
		}

		return margin as [number, number, number, number]
	}

	getExtendedRect(): Rect {
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
	getNaturalHeight(): number {
		let h = this.el.offsetHeight

		let diffHeight = this.el.scrollHeight - this.el.clientHeight
		let maxAllowdDiffWhenNotScrolled = this.trangle ? this.trangle.offsetHeight : 0
		
		if (diffHeight <= maxAllowdDiffWhenNotScrolled) {
			diffHeight = Math.max(...[...this.el.children].map(child => child.scrollHeight - child.clientHeight))
		}
		
		if (diffHeight > 0) {
			h = h + diffHeight
		}
		else {
			setStyle(this.el, 'height', '')
			h = this.el.offsetHeight
		}

		return h
	}

	/** get fixed anchor position in viewport */
	getFixedAnchor(w: number, h: number, anchor: string): [number, number] {
		let x = anchor.includes('l') ? 0 : anchor.includes('r') ? w : w / 2
		let y = anchor.includes('t') ? 0 : anchor.includes('b') ? h : h / 2

		return [x, y]
	}

	/** get absolute anchor position in scrolling page */
	getAbsoluteAnchor(rect: Rect, anchor: string): [number, number] {
		let x = anchor.includes('l') ? 0 : anchor.includes('r') ? rect.width  : rect.width  / 2
		let y = anchor.includes('t') ? 0 : anchor.includes('b') ? rect.height : rect.height / 2

		x += rect.left
		y += rect.top

		return [x, y]
	}

	alignVertical(): boolean {
		let dh = document.documentElement.clientHeight
		let spaceTop = this.targetRect.top
		let spaceBottom = dh - this.targetRect.bottom
		let overflowYSet = false
		let y = this.y

		if (this.direction.top || this.direction.bottom) {
			if (this.direction.top && y < 0 && spaceTop < spaceBottom) {
				y = this.targetRect.bottom
				this.direction.top = false
				this.direction.bottom = true
			}
			else if (y + this.h > dh && spaceTop > spaceBottom) {
				y = this.targetRect.top - this.h
				this.direction.top = true
				this.direction.bottom = false
			}
		}
		else {
			if (y + this.h > dh) {
				y = dh - this.h
			}

			if (y < 0) {
				y = 0
			}
		}

		if (y < 0) {
			if (this.direction.top && this.canShrinkInY) {
				y = 0
				setStyle(this.el, 'height', spaceTop)
				overflowYSet = true
			}
		}
		else if (this.direction.bottom && y + this.h > dh) {
			if (this.canShrinkInY) {
				setStyle(this.el, 'height', spaceBottom)
				overflowYSet = true
			}
		}

		this.y = y

		return overflowYSet
	}

	alignHerizontal() {
		let dw = document.documentElement.clientWidth
		let spaceLeft  = this.targetRect.left
		let spaceRight = dw - this.targetRect.right
		let x = this.x

		if (this.direction.left || this.direction.right) {
			if (this.direction.left && x < 0 && spaceLeft < spaceRight) {
				x = this.targetRect.right
				this.direction.left = false
				this.direction.right = true
			}
			else if (this.direction.right && x > dw - this.w && spaceLeft > spaceRight) {
				x = this.targetRect.left - this.w
				this.direction.left = true
				this.direction.right = false
			}
		}
		else {
			if (x + this.w > dw) {
				x = dw - this.w
			}

			if (x < 0) {
				x = 0
			}
		}

		this.x = x
	}

	alignTrangle() {
		let swapX = false
		let swapY = false
		let trangle = this.trangle!

		if (this.direction.top || this.direction.bottom) {
			let tx

			if (this.w >= this.targetRect.width) {
				tx = this.targetRect.left + this.targetRect.width / 2 - this.x - trangle.offsetWidth / 2
			}
			else {
				tx = this.w / 2 - trangle.offsetWidth / 2
			}

			setStyle(trangle, {left: tx, right: '', top: '', bottom: ''})

			let tTop = getNumeric(trangle, 'top')
			let tBottom = getNumeric(trangle, 'bottom')

			if (tTop < 0 && this.direction.top) {
				swapY = true
				setStyle(trangle, {top: 'auto', bottom: tTop})
			}

			if (tBottom < 0 && this.direction.bottom) {
				swapY = true
				setStyle(trangle, {top: tBottom, bottom: 'auto'})
			}
		}

		if (this.direction.left || this.direction.right) {
			let ty

			if (this.h >= this.targetRect.height) {
				ty = this.targetRect.top + this.targetRect.height / 2 - this.y - trangle.offsetHeight / 2
			}
			else {
				ty = this.h / 2 - trangle.offsetHeight / 2
			}

			setStyle(trangle, {top: ty, bottom: '', left: '', right: ''})

			let tLeft = getNumeric(trangle, 'left')
			let tRight = getNumeric(trangle, 'right')

			if (tLeft < 0 && this.direction.left) {
				swapX = true
				setStyle(trangle, {left: 'auto', right: tLeft})
			}

			if (tRight < 0 && this.direction.right) {
				swapX = true
				setStyle(trangle, {left: tRight, right: 'auto'})
			}
		}

		if (swapX || swapY) {
			let transform = ''

			if (swapX) {
				transform += 'rotateY(180deg)'
			}

			if (swapY) {
				transform += swapX ? ' ' : ''
				transform += 'rotateX(180deg)'
			}

			setStyle(trangle, 'transform', transform)
		}
		else {
			setStyle(trangle, 'transform', '')
		}
	}
}


/**
 * Align element to a mouse event.
 * @param el A fixed position element to align.
 * @param event A mouse event to align to.
 * @param offset `[x, y]` offset to adjust align position. 
 */
export function alignToEvent(el: HTMLElement, event: MouseEvent, offset: [number, number] = [0, 0]) {
	let isFixed = getStyle(el, 'position') === 'fixed'
	if (!isFixed) {
		throw new Error('Element must be "fixed" position when using "alignByEvent"')
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
		x = ex - w
	}

	if (y + h > dh) {
		y = ey - h
	}

	setStyle(el, {
		left: Math.round(x),
		top:  Math.round(y),
	})
}