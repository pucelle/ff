import {Direction} from '../../math'
import {AnchorAligner} from '../anchor-aligner'
import {getAnchorPointAt, getGapTranslate} from './position-gap-parser'


/** Includes target and triangle position. */
export interface PositionComputed {
	anchorFaceDirection: Direction
	anchorDirection: Direction
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
	private anchorFaceDirection: Direction

	constructor(aligner: AnchorAligner, anchorRect: DOMRect) {
		this.aligner = aligner
		this.target = aligner.target
		this.triangle = aligner.options.triangle
		this.anchorRect = anchorRect
		this.targetRect = aligner.target.getBoundingClientRect()
		this.triangleRelRect = this.getTriangleRelRect()
		this.anchorFaceDirection = aligner.anchorFaceDirection
	}

	/** Get triangle rect based on target origin. */
	private getTriangleRelRect(): DOMRect | null {
		if (!this.triangle) {
			return null
		}

		let triangleRect = this.triangle.getBoundingClientRect()

		// Translate by content rect position to become relative.
		return new DOMRect(
			triangleRect.x - this.targetRect.x,
			triangleRect.y - this.targetRect.y,
			triangleRect.width,
			triangleRect.height
		)
	}

	/** 
	 * Align content after known both rects.
	 * Note normally all internal methods should not write dom properties.
	 */
	compute(): PositionComputed {
		let computed: PositionComputed = {
			anchorFaceDirection: this.aligner.anchorFaceDirection,
			anchorDirection: this.aligner.anchorDirection,
			anchor: {
				rect: this.anchorRect
			},
			target: {
				position: {x: 0, y: 0},
				limitHeight: null,
				rect: this.targetRect,
				flipped: false,
			},
			triangle: null,
		}

		// Do content alignment.
		this.doTargetAlignment(computed)

		// Align `triangle` element.
		if (this.triangle) {
			this.alignTriangle(computed)
		}

		computed.anchorFaceDirection = this.anchorFaceDirection
		computed.target.rect = this.targetRect
		computed.target.flipped = this.anchorFaceDirection !== this.aligner.anchorFaceDirection

		return computed
	}

	/** 
	 * Do alignment from content to anchor for once.
	 * It outputs alignment position to `targetRect`.
	 */
	private doTargetAlignment(computed: PositionComputed) {
		let anchorT = this.getTargetRelativeAnchorPoint()
		let anchorA = this.getAnchorAbsoluteAnchorPoint()

		computed.target.position = this.getPositionByAnchors(anchorT, anchorA)

		// Handle vertical alignment.
		this.alignTargetVertical(computed)

		// If target's height changed, may also cause width get changed.
		// So force re-layout here.
		if (computed.target.limitHeight) {
			this.target.style.height = computed.target.limitHeight + 'px'
			this.targetRect = this.target.getBoundingClientRect()
			anchorT = this.getTargetRelativeAnchorPoint()
			computed.target.position = this.getPositionByAnchors(anchorT, anchorA)
		}

		// Handle horizontal alignment.
		this.alignTargetHorizontal(computed)
	}

	/** Get relative anchor position in the origin of target. */
	private getTargetRelativeAnchorPoint(): Coord {
		let point = {x: 0, y: 0}

		// Anchor at triangle position.
		if (this.aligner.options.fixedTriangle && this.triangleRelRect) {
			if (this.anchorFaceDirection.beVertical) {
				point.x = this.triangleRelRect.left + this.triangleRelRect.width / 2
			}
			else if (this.anchorFaceDirection.beHorizontal) {
				point.y = this.triangleRelRect.top + this.triangleRelRect.height / 2
			}
		}
		else {
			point = getAnchorPointAt(this.targetRect, this.aligner.targetDirection)
	
			// From absolute to relative.
			point.x -= this.targetRect.x
			point.y -= this.targetRect.y
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

		if (this.anchorFaceDirection.beVertical) {

			// Not enough space at top side, switch to bottom.
			if (this.anchorFaceDirection === Direction.Top && y < 0 && spaceTop < spaceBottom && this.aligner.options.flipDirection) {
				y = this.anchorRect.bottom + this.aligner.gaps.bottom
				this.anchorFaceDirection = Direction.Bottom
				computed.anchorDirection = computed.anchorDirection.horizontal.joinWith(Direction.Bottom)
			}

			// Not enough space at bottom side, switch to top.
			else if (this.anchorFaceDirection === Direction.Bottom && y + h > dh && spaceTop > spaceBottom && this.aligner.options.flipDirection) {
				y = this.anchorRect.top - this.aligner.gaps.top - h
				this.anchorFaceDirection = Direction.Top
				computed.anchorDirection = computed.anchorDirection.horizontal.joinWith(Direction.Top)
			}
		}
		else {

			// Can move up a little to become fully visible.
			if (y + h + this.aligner.edgeGaps.bottom > dh && this.aligner.options.stickToEdges) {
				
				// Gives enough space for triangle.
				let minY = this.anchorRect.top + (this.triangleRelRect ? this.triangleRelRect.height : 0) - h
				y = Math.max(dh - h - this.aligner.edgeGaps.bottom, minY)
			}

			// Can move down a little to become fully visible.
			if (y - this.aligner.edgeGaps.top < 0 && this.aligner.options.stickToEdges) {

				// Gives enough space for triangle.
				let maxY = this.anchorRect.bottom - (this.triangleRelRect ? this.triangleRelRect.height : 0)
				y = Math.min(this.aligner.edgeGaps.top, maxY)
			}
		}

		if (this.aligner.options.stickToEdges) {

			// Limit element height if has not enough space.
			if (this.anchorFaceDirection === Direction.Top && y < 0 && this.aligner.options.stickToEdges) {
				y = 0
				h = spaceTop
				heightLimited = true
			}
			else if (this.anchorFaceDirection === Direction.Bottom && y + h > dh && this.aligner.options.stickToEdges) {
				h = spaceBottom
				heightLimited = true
			}
			else if (!this.anchorFaceDirection.beVertical && this.targetRect.height > dh) {
				y = 0
				h = dh
				heightLimited = true
			}
		}

		// Handle sticking to edges.
		else if (this.aligner.options.stickToEdges) {
			if (this.anchorFaceDirection.beVertical) {
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

		if (this.anchorFaceDirection.beHorizontal) {

			// Not enough space at left side.
			if (this.anchorFaceDirection === Direction.Left && x < 0 && spaceLeft < spaceRight && this.aligner.options.flipDirection) {
				x = this.anchorRect.right + this.aligner.gaps.right
				computed.target.position.x = this.anchorRect.right
				this.anchorFaceDirection = Direction.Right
				computed.anchorDirection = computed.anchorDirection.vertical.joinWith(Direction.Right)
			}

			// Not enough space at right side.
			else if (this.anchorFaceDirection === Direction.Right && x > dw - w && spaceLeft > spaceRight && this.aligner.options.flipDirection) {
				x = this.anchorRect.left - this.aligner.gaps.left - w
				this.anchorFaceDirection = Direction.Left
				computed.anchorDirection = computed.anchorDirection.vertical.joinWith(Direction.Left)
			}
		}
		else {

			// Can move left a little to become fully visible.
			if (x + w + this.aligner.edgeGaps.right > dw && this.aligner.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = this.anchorRect.left + (this.targetRect ? this.targetRect.width : 0) - w
				x = Math.max(dw - w - this.aligner.edgeGaps.right, minX)
			}

			// Can move right a little to become fully visible.
			if (x - this.aligner.edgeGaps.left < 0 && this.aligner.options.stickToEdges) {

				// Gives enough space for triangle.
				let minX = this.anchorRect.right - (this.targetRect ? this.targetRect.width : 0)
				x = Math.min(this.aligner.edgeGaps.left, minX)
			}
		}

		// Process sticking to edges.
		if (this.aligner.options.stickToEdges) {
			if (this.anchorFaceDirection.beHorizontal) {
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

		if (this.anchorFaceDirection.beVertical) {
			let x = this.computeTrianglePosition(
				this.targetRect.width,
				this.anchorRect.width, this.anchorRect.x - this.targetRect.x,
				triangleRelRect.width, triangleRelRect.x
			)

			let translateX = x - triangleRelRect.x
			transforms.push(`translateX(${translateX}px)`)
		}
		else if (this.anchorFaceDirection.beHorizontal) {
			let y = this.computeTrianglePosition(
				this.targetRect.height,
				this.anchorRect.height, this.anchorRect.y - this.targetRect.y,
				triangleRelRect.height, triangleRelRect.y
			)

			let translateY = y - triangleRelRect.y
			transforms.push(`translateY(${translateY}px)`)
		}

		let triangleSwapped = this.anchorFaceDirection !== this.aligner.anchorFaceDirection
	
		if (triangleSwapped) {
			if (this.anchorFaceDirection.beHorizontal) {
				transforms.push('scaleX(-1)')
			}
			else {
				transforms.push('scaleY(-1)')
			}

			computed.triangle.flipped = true
		}
			
		if (this.anchorFaceDirection === Direction.Top) {
			computed.triangle.inset.top = 'auto'
			computed.triangle.inset.bottom = -triangleRelRect.height + 'px'
		}
		else if (this.anchorFaceDirection === Direction.Bottom) {
			computed.triangle.inset.top = -triangleRelRect.height + 'px'
			computed.triangle.inset.bottom = 'auto'
		}
		else if (this.anchorFaceDirection === Direction.Left) {
			computed.triangle.inset.left = 'auto'
			computed.triangle.inset.right = -triangleRelRect.width + 'px'
		}
		else if (this.anchorFaceDirection === Direction.Right) {
			computed.triangle.inset.left = -triangleRelRect.width + 'px'
			computed.triangle.inset.right = 'auto'
		}

		computed.triangle.transform = transforms.join(' ')
	}

	/**
	 * Compute triangle position.
	 * All coordinates based on content origin.
	 */
	private computeTrianglePosition(
		contentW: number,
		anchorW: number, anchorX: number,
		triangleW: number, triangleX: number
	) {
		let x: number = 0

		// In fixed position.
		if (this.aligner.options.fixedTriangle) {
			x = triangleX
		}

		// Align with center of target, normally.
		else if (this.aligner.targetDirection.beStraight) {
			x = contentW / 2 - triangleW / 2
		}

		// Align with center of anchor.
		else if (this.aligner.anchorDirection.beStraight && !this.aligner.targetDirection.beStraight) {
			x = (anchorX + anchorW) / 2 - triangleW / 2
		}

		// Align non-center to non-center, also choose narrower one.
		else {
			if (contentW <= anchorW) {
				x = contentW / 2 - triangleW / 2
			}
			else {
				x = (anchorX + anchorW) / 2 - triangleW / 2
			}
		}

		// Limit to the intersect edge of content and anchors.
		let minX = Math.max(0, anchorX)
		let maxX = Math.min(contentW - triangleW / 2, anchorX + anchorW - triangleW / 2)

		x = Math.max(x, minX)
		x = Math.min(x, maxX)

		return x
	}
}
