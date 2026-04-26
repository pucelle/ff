import {Coord, Direction, Vector} from '../../../math'


/** Align which direction of target to which direction of anchor. */
export type AnchorPosition = NormalAnchorPositionSingle
	| AdditionalTwoCharsPosition
	| `${NormalAnchorPositionSingle}-${NormalAnchorPositionSingle}`

/** Single of anchor position. */
type NormalAnchorPositionSingle = 't'
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

/** Additional anchor positions. */
type AdditionalTwoCharsPosition = 'lb'
	| 'rb'
	| 'lt'
	| 'rt'
	| 'ct'
	| 'cb'

/** 4 directions of gap. */
export interface AnchorGaps {
	top: number
	right: number
	bottom: number
	left: number
}


/** Position string -> Direction. */
const PositionDirectionMap: Record<string, Direction> = /*#__PURE__*/(() => ({
	c : Direction.Center,
	t : Direction.Top,
	b : Direction.Bottom,
	l : Direction.Left,
	r : Direction.Right,
	cc: Direction.Center,
	tl: Direction.TopLeft,
	tr: Direction.TopRight,
	tc: Direction.Top,
	bl: Direction.BottomLeft,
	br: Direction.BottomRight,
	bc: Direction.Bottom,
}))()


/**
 * Full type is `[tbc][lrc]-[tbc][lrc]`, means `[Y of el][X of el]-[Y of anchor][X of anchor]`.
 * Shorter type should be `[Touch][Align]` or `[Touch]`.
 * E.g.: `t` is short for `tc` or `b-t` or `bc-tc`, which means align content to the top-center of anchor.
 * E.g.: `tl` is short for `bl-tl`, which means align content to the top-left of anchor.
 * E.g.: `lt` is short for `tr-tl`, which means align content to the left-top of anchor.
 */
export function parseAlignDirections(position: AnchorPosition): [Direction, Direction] {
	let d1: Direction
	let d2: Direction

	if (position.length === 1) {

		// `t` means `b-t`.
		d2 = parseSingleAlignDirection(position)
		d1 = d2.opposite
	}
	else if (position.length === 2) {

		// `tl` means `bl-tl`.
		// `lt` means `tr-tl`.
		let first = parseSingleAlignDirection(position[0])
		let second = parseSingleAlignDirection(position[1])

		d2 = first.joinWith(second)
		d1 = first.opposite.joinWith(second)
	}
	else {
		let posArray = position.split('-')
		d1 = parseSingleAlignDirection(posArray[0])
		d2 = parseSingleAlignDirection(posArray[1])
	}

	return [d1, d2]
}


/** Parse single piece, 1 or 2 chars. */
function parseSingleAlignDirection(position: string): Direction {
	if (position.length === 1) {
		return PositionDirectionMap[position]
	}
	else if (position.length === 2) {
		let first = PositionDirectionMap[position[0]]
		let second = PositionDirectionMap[position[1]]

		return first.joinWith(second)
	}
	else {
		throw new Error(`'${position}' is not a valid position piece`)
	}
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
			gap.top = Math.max(gap.top, triangle.offsetHeight)
			gap.bottom = Math.max(gap.bottom, triangle.offsetHeight)
		}

		if (anchorFaceDirection.beHorizontal) {
			gap.right = Math.max(gap.right, triangle.offsetWidth)
			gap.left = Math.max(gap.left, triangle.offsetWidth)
		}
	}

	return gap
}


/** 
 * Get gap translate apply to target element.
 * The gap translate will apply only when none of them is center-aligned.
 */
export function getGapTranslate(anchorDirection: Direction, targetDirection: Direction, gaps: AnchorGaps): Vector {
	let anchorV = anchorDirection.toVector()
	let translate = new Vector()

	if (anchorDirection.horizontal !== Direction.Center
		&& targetDirection.horizontal !== Direction.Center
	) {
		translate.x += anchorV.x * gaps[anchorDirection.horizontal.toBoxOffsetKey()!]
	}

	if (anchorDirection.vertical !== Direction.Center
		&& targetDirection.vertical !== Direction.Center
	) {
		translate.y += anchorV.y * gaps[anchorDirection.vertical.toBoxOffsetKey()!]
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


/** 
 * Get the relative anchor point by a rects and direction.
 * Get the relative point of `rectToAlign`, and based on `rectOfTarget` origin.
 */
export function getRelativeAnchorPointAt(rectOfTarget: DOMRect, rectToAlign: DOMRect = rectOfTarget, d: Direction): Coord {
	let v = d.toAnchorVector()

	return {
		x: v.x * rectToAlign.width + rectToAlign.x - rectOfTarget.x,
		y: v.y * rectToAlign.height + rectToAlign.y - rectOfTarget.y,
	}
}