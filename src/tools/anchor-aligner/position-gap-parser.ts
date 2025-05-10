import {Direction, Vector} from '../../math'


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

/** 4 directions of gap. */
export interface AnchorGaps {
	top: number
	right: number
	bottom: number
	left: number
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
export function parseAlignDirections(position: AnchorPosition): [Direction, Direction] {
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
export function parseGaps(gapValue: number | number[], triangle: HTMLElement | undefined, anchorFaceDirection: Direction): AnchorGaps {
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


/** Get gap translate apply to target element. */
export function getGapTranslate(anchorDirection: Direction, gaps: AnchorGaps): Vector {
	let edgeKeys = anchorDirection.toInsetKeys()
	let alignVector = anchorDirection.toVector()
	let translate = new Vector()

	for (let key of edgeKeys) {
		let gap = gaps[key]

		if (key === 'left' || key === 'right') {
			translate.x += alignVector.x * gap
		}
		else {
			translate.y += alignVector.y * gap
		}
	}

	return translate
}



/** Get the anchor point by a rect and direction. */
export function getAnchorPointAt(rect: DOMRect, d: Direction): Coord {
	let v = d.toAnchorVector()

	return {
		x: rect.x + v.x * rect.width,
		y: rect.y + v.y * rect.height,
	}
}


/** Get the relative anchor point by a rect and direction. */
export function getRelativeAnchorPointAt(rect: DOMRect, d: Direction): Coord {
	let v = d.toAnchorVector()

	return {
		x: v.x * rect.width,
		y: v.y * rect.height,
	}
}