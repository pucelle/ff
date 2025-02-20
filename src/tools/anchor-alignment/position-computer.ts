import {Direction} from '../../math'
import {AnchorAligner} from '../anchor-aligner'
import {getAnchorPointAt, getGapTranslate, getRelativeAnchorPointAt} from './position-gap-parser'


/** Includes target and triangle position. */
export interface PositionComputed {
	anchorFaceDirection: Direction
	anchorDirection: Direction
	targetDirection: Direction
	anchor: {
		rect: DOMRect
	},
	target: {
		position: Coord
		limitHeight: number | null
		rect: DOMRect
		flipped: boolean
	}
	triangle: {
		inset: {
			top: string
			right: string
			bottom: string
			left: string
		}
		transform: string
		flipped: boolean
	} | null
}


/** To computed target and triangle position. */
export class PositionComputer {
	
	private aligner: AnchorAligner
	private target: HTMLElement
	private triangle: HTMLElement | undefined
	private anchorRect: DOMRect
	private targetRect: DOMRect
	private triangleRelRect: DOMRect | null

	constructor(aligner: AnchorAligner, anchorRect: DOMRect) {
		this.aligner = aligner
		this.target = aligner.target
		this.triangle = aligner.options.triangle
		this.anchorRect = anchorRect
		this.targetRect = aligner.target.getBoundingClientRect()
		this.triangleRelRect = this.getTriangleRelRect()
	}

	/** Get triangle rect based on target origin. */
	private getTriangleRelRect(): DOMRect | null {
		if (!this.triangle) {
			return null
		}

		let triangleRect = this.triangle.getBoundingClientRect()

		// Translate by target rect position to become relative.
		return new DOMRect(
			triangleRect.x - this.targetRect.x,
			triangleRect.y - this.targetRect.y,
			triangleRect.width,
			triangleRect.height
		)
	}

	/** 
	 * Align target after known both rects.
	 * Note normally all internal methods should not write dom properties.
	 */
	compute(): PositionComputed {
		let computed: PositionComputed = {
			anchorFaceDirection: this.aligner.anchorFaceDirection,
			anchorDirection: this.aligner.anchorDirection,
			targetDirection: this.aligner.targetDirection,
			anchor: {
				rect: this.anchorRect,
			},
			target: {
				position: {x: 0, y: 0},
				limitHeight: null,
				rect: this.targetRect,
				flipped: false,
			},
			triangle: null,
		}

		// Do target alignment.
		this.doTargetAlignment(computed)

		// Align `triangle` element.
		if (this.triangle) {
			this.alignTriangle(computed)
		}

		computed.anchorFaceDirection = computed.anchorFaceDirection
		computed.target.rect = this.targetRect
		computed.target.flipped = computed.anchorFaceDirection !== this.aligner.anchorFaceDirection

		return computed
	}

	/** 
	 * Do alignment from target to anchor for once.
	 * It outputs alignment position to `targetRect`.
	 */
	private doTargetAlignment(computed: PositionComputed) {
		let targetPoint = this.getTargetRelativeAnchorPoint(computed)
		let anchorPoint = this.getAnchorAbsoluteAnchorPoint()

		computed.target.position = this.getPositionByAnchors(targetPoint, anchorPoint)

		// Handle vertical alignment.
		this.alignTargetVertical(computed)

		// If target's height changed, may also cause width get changed.
		// So force re-layout here.
		if (computed.target.limitHeight) {
			this.target.style.height = computed.target.limitHeight + 'px'
			this.targetRect = this.target.getBoundingClientRect()

			targetPoint = this.getTargetRelativeAnchorPoint(computed)
			computed.target.position = this.getPositionByAnchors(targetPoint, anchorPoint)
		}

		// Handle horizontal alignment.
		this.alignTargetHorizontal(computed)
	}

	/** Get relative anchor position in the origin of target. */
	private getTargetRelativeAnchorPoint(computed: PositionComputed): Coord {
		let point = {x: 0, y: 0}

		// Anchor at triangle position.
		if (this.aligner.options.fixedTriangle && this.triangleRelRect) {
			if (computed.anchorFaceDirection.beVertical) {
				point.x = this.triangleRelRect.left + this.triangleRelRect.width / 2
			}
			else if (computed.anchorFaceDirection.beHorizontal) {
				point.y = this.triangleRelRect.top + this.triangleRelRect.height / 2
			}
		}
		else {
			point = getRelativeAnchorPointAt(this.targetRect, this.aligner.targetDirection)
		}

		return point
	}

	/** Get absolute position of anchor in the origin of scrolling page. */
	private getAnchorAbsoluteAnchorPoint(): Coord {
		let point = getAnchorPointAt(this.anchorRect, this.aligner.anchorDirection)
		return point
	}

	/** Get position by two anchors. */
	private getPositionByAnchors(anchorT: Coord, anchorA: Coord) {
		let position = {x: anchorA.x - anchorT.x, y: anchorA.y - anchorT.y}
		let gapTranslate = getGapTranslate(this.aligner.anchorDirection, this.aligner.gaps)

		position.x += gapTranslate.x
		position.y += gapTranslate.y

		return position
	}

	/** 
	 * Do vertical alignment, will modify `targetRect`.
	 * It outputs alignment position to `targetRect`.
	 */
	private alignTargetVertical(computed: PositionComputed) {
		let y = computed.target.position.y
		let dh = document.documentElement.clientHeight
		let spaceTop = this.anchorRect.top - this.aligner.gaps.top
		let spaceBottom = dh - (this.anchorRect.bottom + this.aligner.gaps.bottom)
		let heightLimited = false
		let h = this.targetRect.height

		if (computed.anchorFaceDirection.beVertical) {

			// Not enough space at top side, switch to bottom.
			if (computed.anchorFaceDirection === Direction.Top
				&& y < 0
				&& spaceTop < spaceBottom
				&& this.aligner.options.flipDirection
			) {
				y = this.anchorRect.bottom + this.aligner.gaps.bottom
				this.flipDirections(computed, Direction.Bottom)
			}

			// Not enough space at bottom side, switch to top.
			else if (computed.anchorFaceDirection === Direction.Bottom
				&& y + h > dh
				&& spaceTop > spaceBottom
				&& this.aligner.options.flipDirection
			) {
				y = this.anchorRect.top - this.aligner.gaps.top - h
				this.flipDirections(computed, Direction.Top)
			}
		}
		else {

			// Can move up a little to become fully visible.
			if (y + h + this.aligner.edgeGaps.bottom > dh && this.aligner.options.stickToEdges) {
				y = dh - h - this.aligner.edgeGaps.bottom
			}

			// Can move down a little to become fully visible.
			if (y - this.aligner.edgeGaps.top < 0 && this.aligner.options.stickToEdges) {
				y = this.aligner.edgeGaps.top
			}
		}

		if (this.aligner.options.stickToEdges) {

			// Limit element height if has not enough space.
			if (computed.anchorFaceDirection === Direction.Top && y < 0 && this.aligner.options.stickToEdges) {
				y = 0
				h = spaceTop
				heightLimited = true
			}
			else if (computed.anchorFaceDirection === Direction.Bottom && y + h > dh && this.aligner.options.stickToEdges) {
				h = spaceBottom
				heightLimited = true
			}
			else if (!computed.anchorFaceDirection.beVertical && this.targetRect.height > dh) {
				y = 0
				h = dh
				heightLimited = true
			}
		}

		// Handle sticking to edges.
		else if (this.aligner.options.stickToEdges) {
			if (computed.anchorFaceDirection.beVertical) {
				y = Math.min(y, dh - this.targetRect.height)
				y = Math.max(0, y)
			}
		}

		// Apply limited height.
		if (heightLimited) {
			computed.target.limitHeight = h
		}

		computed.target.position.y = y
	}

	/** Flip align directions. */
	private flipDirections(computed: PositionComputed, toDirection: Direction) {
		computed.anchorFaceDirection = toDirection

		if (toDirection.beHorizontal) {
			computed.anchorDirection = computed.anchorDirection.vertical.joinWith(toDirection)
			computed.targetDirection = computed.targetDirection.vertical.joinWith(toDirection.opposite)
		}
		else {
			computed.anchorDirection = computed.anchorDirection.horizontal.joinWith(toDirection)
			computed.targetDirection = computed.targetDirection.horizontal.joinWith(toDirection.opposite)
		}
	}

	/** 
	 * Do horizontal alignment.
	 * It outputs alignment position to `targetRect`.
	 */
	private alignTargetHorizontal(computed: PositionComputed) {
		let x = computed.target.position.x
		let dw = document.documentElement.clientWidth
		let spaceLeft = this.anchorRect.left - this.aligner.gaps.left
		let spaceRight = dw - (this.anchorRect.right + this.aligner.gaps.right)
		let w = this.targetRect.width

		if (computed.anchorFaceDirection.beHorizontal) {

			// Not enough space at left side.
			if (computed.anchorFaceDirection === Direction.Left
				&& x < 0
				&& spaceLeft < spaceRight
				&& this.aligner.options.flipDirection
			) {
				x = this.anchorRect.right + this.aligner.gaps.right
				computed.target.position.x = this.anchorRect.right
				this.flipDirections(computed, Direction.Right)
			}

			// Not enough space at right side.
			else if (computed.anchorFaceDirection === Direction.Right
				&& x > dw - w
				&& spaceLeft > spaceRight
				&& this.aligner.options.flipDirection
			) {
				x = this.anchorRect.left - this.aligner.gaps.left - w
				this.flipDirections(computed, Direction.Left)
			}
		}
		else {

			// Move left a little to become fully visible.
			if (x + w + this.aligner.edgeGaps.right > dw && this.aligner.options.stickToEdges) {
				x = dw - w - this.aligner.edgeGaps.right
			}

			// Move right a little to become fully visible.
			if (x - this.aligner.edgeGaps.left < 0 && this.aligner.options.stickToEdges) {
				x = this.aligner.edgeGaps.left
			}
		}

		// Process sticking to edges.
		if (this.aligner.options.stickToEdges) {
			if (computed.anchorFaceDirection.beHorizontal) {
				x = Math.min(x, dw - this.targetRect.width)
				x = Math.max(0, x)
			}
		}

		computed.target.position.x = x
	}

	/** Align `triangle` relative to target. */
	private alignTriangle(computed: PositionComputed) {
		let triangleRelRect = this.triangleRelRect!
		let transforms: string[] = []

		computed.triangle = {
			inset: {
				top: '',
				left: '',
				right: '',
				bottom: '',
			},
			transform: '',
			flipped: false,
		}

		if (computed.anchorFaceDirection.beVertical) {
			let x = this.computeTrianglePosition(
				this.targetRect.width,
				this.anchorRect.width, this.anchorRect.x - computed.target.position.x,
				triangleRelRect.width, triangleRelRect.x,
				computed
			)

			transforms.push(`translateX(${x}px)`)
		}
		else if (computed.anchorFaceDirection.beHorizontal) {
			let y = this.computeTrianglePosition(
				this.targetRect.height,
				this.anchorRect.height, this.anchorRect.y - computed.target.position.y,
				triangleRelRect.height, triangleRelRect.y,
				computed
			)

			transforms.push(`translateY(${y}px)`)
		}

		let triangleSwapped = computed.anchorFaceDirection !== this.aligner.anchorFaceDirection
	
		if (triangleSwapped) {
			if (computed.anchorFaceDirection.beHorizontal) {
				transforms.push('scaleX(-1)')
			}
			else {
				transforms.push('scaleY(-1)')
			}

			computed.triangle.flipped = true
		}
			
		if (computed.anchorFaceDirection === Direction.Top) {
			computed.triangle.inset.top = 'auto'
			computed.triangle.inset.bottom = -triangleRelRect.height + 'px'
			computed.triangle.inset.left = '0'
		}
		else if (computed.anchorFaceDirection === Direction.Bottom) {
			computed.triangle.inset.top = -triangleRelRect.height + 'px'
			computed.triangle.inset.bottom = 'auto'
			computed.triangle.inset.left = '0'
		}
		else if (computed.anchorFaceDirection === Direction.Left) {
			computed.triangle.inset.left = 'auto'
			computed.triangle.inset.right = -triangleRelRect.width + 'px'
			computed.triangle.inset.top = '0'
		}
		else if (computed.anchorFaceDirection === Direction.Right) {
			computed.triangle.inset.left = -triangleRelRect.width + 'px'
			computed.triangle.inset.right = 'auto'
			computed.triangle.inset.top = '0'
		}

		computed.triangle.transform = transforms.join(' ')
	}

	/**
	 * Compute triangle position.
	 * All coordinates based on target origin.
	 */
	private computeTrianglePosition(
		targetW: number,
		anchorW: number, anchorX: number,
		triangleW: number, triangleX: number,
		computed: PositionComputed
	) {
		let x: number = 0

		// In fixed position.
		if (this.aligner.options.fixedTriangle) {
			x = triangleX
		}

		// Align with center of collapse edges of anchor and target.
		else if (computed.anchorDirection.beStraight && computed.targetDirection.beStraight) {
			x = Math.max(0, anchorX) / 2 + Math.min(targetW, anchorX + anchorW) / 2 - triangleW / 2
		}

		// Align with center of target, normally.
		else if (computed.targetDirection.beStraight) {
			x = targetW / 2 - triangleW / 2
		}

		// Align with center of anchor.
		else if (computed.anchorDirection.beStraight) {
			x = (anchorX + anchorW) / 2 - triangleW / 2
		}

		// Align non-center to non-center, also choose narrower one.
		else {
			if (targetW <= anchorW) {
				x = targetW / 2 - triangleW / 2
			}
			else {
				x = (anchorX + anchorW) / 2 - triangleW / 2
			}
		}

		// Limit to the intersect edge of content and anchors.
		let minX = Math.max(0, anchorX)
		let maxX = Math.min(targetW - triangleW / 2, anchorX + anchorW - triangleW / 2)

		x = Math.max(x, minX)
		x = Math.min(x, maxX)

		return x
	}
}
