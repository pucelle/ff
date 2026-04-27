import {Box, Coord, Direction, Vector} from '../../../math'
import {DOMUtils} from '../../../utils'
import {barrierDOMReading, barrierDOMWriting} from 'lupos'
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
		position: Vector
		limitHeight: number | null
		rect: DOMRect
		flipped: boolean
		absolutePositionOffset: Vector | null
	}
	triangle: {
		inset: {
			top: string
			right: string
			bottom: string
			left: string
		}
		transform: string
	} | null
}


/** 
 * To computed target and triangle position.
 * Ensure to barrier DOM Reading before calling it.
 */
export class PositionComputer {
	
	private aligner: AnchorAligner
	private target: HTMLElement
	private triangle: HTMLElement | undefined
	private anchorRect: DOMRect
	private targetRect: DOMRect
	private targetRectToAlign: DOMRect
	private triangleRelRect: DOMRect | null
	private targetBorderTop: number
	private targetBorderLeft: number

	constructor(aligner: AnchorAligner, anchorRect: DOMRect) {
		this.aligner = aligner
		this.target = aligner.target
		this.triangle = aligner.options.triangle
		this.anchorRect = anchorRect
		this.targetRect = aligner.target.getBoundingClientRect()
		this.targetRectToAlign = this.computeTargetRectToAlign()
		this.triangleRelRect = this.getTriangleRelRect()

		let targetStyle = getComputedStyle(aligner.target)
		this.targetBorderTop = parseFloat(targetStyle.borderTopWidth)
		this.targetBorderLeft = parseFloat(targetStyle.borderLeftWidth)
	}

	/** Must after setting `this.targetRect`. */
	private computeTargetRectToAlign() {
		let targetToAlign = this.aligner.targetToAlign
		if (targetToAlign === this.aligner.target) {
			return this.targetRect
		}
		else {
			let alignRect = targetToAlign.getBoundingClientRect()
			let faceHV = this.aligner.anchorFaceDirection.hvDirection

			if (faceHV !== null) {
				alignRect = Box.fromLike(alignRect).unionAtHVSelf(Box.fromLike(this.targetRect), faceHV)
			}

			return alignRect
		}
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
	async compute(): Promise<PositionComputed> {
		let computed: PositionComputed = {
			anchorFaceDirection: this.aligner.anchorFaceDirection,
			anchorDirection: this.aligner.anchorDirection,
			targetDirection: this.aligner.targetDirection,
			anchor: {
				rect: this.anchorRect,
			},
			target: {
				position: new Vector(),
				limitHeight: null,
				rect: this.targetRect,
				flipped: false,
				absolutePositionOffset: this.getAbsoluteLayoutOffset(),
			},
			triangle: null,
		}

		// Do target alignment.
		// May write and read dom properties.
		await this.doTargetAlignment(computed)

		// Align `triangle` element.
		if (this.triangle) {
			this.alignTriangle(computed)
		}
		
		// Target rect may be reset when aligning.
		computed.target.rect = this.targetRect

		return computed
	}

	/** Get offset to convert fixed position to absolute position. */
	private getAbsoluteLayoutOffset() {
		let targetInAbsolutePosition = DOMUtils.getStyleValue(this.target, 'position') === 'absolute'

		// For absolute layout content, convert x, y to absolute position.
		if (targetInAbsolutePosition
			&& this.aligner.anchor !== document.body
			&& this.aligner.anchor !== document.documentElement
		) {
			let offset = new Vector()
			let offsetParent = this.target.offsetParent as HTMLElement

			// If we use body's top position, it will cause a bug when body has a margin top (even from margin collapse).
			if (offsetParent) {
				let parentRect = offsetParent.getBoundingClientRect()
				offset.x -= parentRect.left
				offset.y -= parentRect.top
			}

			return offset
		}

		return null
	}

	/** 
	 * Do alignment from target to anchor for once.
	 * It outputs alignment position to `targetRect`.
	 */
	private async doTargetAlignment(computed: PositionComputed) {
		let targetPoint = this.getTargetRelativeAnchorPoint(computed.targetDirection)
		let anchorPoint = this.getAnchorAbsoluteAnchorPoint(computed.anchorDirection)

		computed.target.position = this.getPositionByAnchors(targetPoint, anchorPoint, computed.targetDirection, computed.anchorDirection)

		// Handle vertical alignment.
		this.alignTargetVertical(computed)

		// If target's height changed, may also cause width get changed.
		// So force re-layout here.
		if (computed.target.limitHeight) {

			// Barrier DOM Reading here.
			await barrierDOMWriting()
			this.target.style.height = computed.target.limitHeight + 'px'

			// Barrier DOM Reading here.
			await barrierDOMReading()
			this.targetRect = this.target.getBoundingClientRect()
			this.targetRectToAlign = this.computeTargetRectToAlign()

			targetPoint = this.getTargetRelativeAnchorPoint(computed.targetDirection)

			if (computed.target.flipped) {
				anchorPoint = this.getAnchorAbsoluteAnchorPoint(computed.anchorDirection)
			}

			computed.target.position = this.getPositionByAnchors(targetPoint, anchorPoint, computed.targetDirection, computed.anchorDirection)
		}

		// Handle horizontal alignment.
		this.alignTargetHorizontal(computed)
	}

	/** Get relative anchor position in the origin of target. */
	private getTargetRelativeAnchorPoint(targetDirection: Direction): Coord {
		let point = getRelativeAnchorPointAt(this.targetRect, this.targetRectToAlign, targetDirection)
		return point
	}

	/** Get absolute position of anchor in the origin of scrolling page. */
	private getAnchorAbsoluteAnchorPoint(anchorDirection: Direction): Coord {
		let point = getAnchorPointAt(this.anchorRect, anchorDirection)
		return point
	}

	/** Get position by two anchors. */
	private getPositionByAnchors(anchorT: Coord, anchorA: Coord, targetDirection: Direction, anchorDirection: Direction): Vector {
		let position = new Vector(anchorA.x - anchorT.x, anchorA.y - anchorT.y)
		let gapTranslate = getGapTranslate(anchorDirection, targetDirection, this.aligner.gaps)

		position.addSelf(gapTranslate)

		return position
	}

	/** 
	 * Do vertical alignment, will modify `targetRect`.
	 * It outputs alignment position to `targetRect`.
	 */
	private alignTargetVertical(computed: PositionComputed) {

		// Now transform origin to exclude edge gaps.
		let dt = this.aligner.edgeGaps.top
		let db = this.aligner.edgeGaps.bottom
		let y = computed.target.position.y - dt
		let dh = document.documentElement.clientHeight - dt - db
		let spaceTop = this.anchorRect.top - dt
		let spaceBottom = dh - (this.anchorRect.bottom - dt)
		let heightLimited = false
		let h = this.targetRect.height

		// Handle flipping.
		if (computed.anchorFaceDirection.beVertical) {

			// Not enough space at top side, switch to bottom.
			if (computed.anchorFaceDirection === Direction.Top
				&& this.aligner.options.flipDirection !== 'horizontal'
			) {
				let shouldFlip = this.aligner.flipped || (y < 0 && spaceTop * 1.2 < spaceBottom)
				if (shouldFlip) {
					y = this.anchorRect.bottom - dt + this.aligner.gaps.bottom
					this.flipDirections(computed, Direction.Bottom)
				}
			}

			// Not enough space at bottom side, switch to top.
			else if (computed.anchorFaceDirection === Direction.Bottom
				&& this.aligner.options.flipDirection !== 'horizontal'
			) {
				let shouldFlip = this.aligner.flipped || (y + h > dh && spaceBottom * 1.2 < spaceTop)
				if (shouldFlip) {
					y = this.anchorRect.top - dt - this.aligner.gaps.top - h
					this.flipDirections(computed, Direction.Top)
				}
			}
		}

		// Limit element height if has not enough space.
		if (this.aligner.options.stickToEdges) {
			if (y < 0) {
				y = 0

				if (computed.anchorFaceDirection === Direction.Top) {
					h = spaceTop - this.aligner.gaps.top
					heightLimited = true
				}
			}
			else if (y + h > dh) {
				if (computed.anchorFaceDirection === Direction.Bottom) {
					h = spaceBottom - this.aligner.gaps.bottom
					heightLimited = true
				}
				else {
					y = dh - h
				}
			}

			// Higher than document.
			else if (this.targetRect.height > dh) {
				y = 0
				h = dh
				heightLimited = true
			}
		}

		// Apply limited height.
		if (heightLimited) {
			computed.target.limitHeight = h
		}

		// Now transform to original origin.
		computed.target.position.y = y + dt
	}

	/** Flip align directions. */
	private flipDirections(computed: PositionComputed, toDirection: Direction) {
		computed.anchorFaceDirection = toDirection
		computed.target.flipped = true

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
		
		// Now transform origin to exclude edge gaps.
		let dl = this.aligner.edgeGaps.left
		let dr = this.aligner.edgeGaps.right
		let x = computed.target.position.x - dl
		let dw = document.documentElement.clientWidth - dl - dr
		let spaceLeft = this.anchorRect.left - dl
		let spaceRight = dw - (this.anchorRect.right - dl)
		let w = this.targetRect.width

		// Handle flipping.
		if (computed.anchorFaceDirection.beHorizontal) {

			// Not enough space at left side.
			if (computed.anchorFaceDirection === Direction.Left
				&& this.aligner.options.flipDirection !== 'vertical'
			) {
				let shouldFlip = this.aligner.flipped || (x < 0 && spaceLeft < spaceRight)
				if (shouldFlip) {
					x = this.anchorRect.right + this.aligner.gaps.right
					computed.target.position.x = this.anchorRect.right
					this.flipDirections(computed, Direction.Right)
				}
			}

			// Not enough space at right side.
			else if (computed.anchorFaceDirection === Direction.Right
				&& this.aligner.options.flipDirection !== 'vertical'
			) {
				let shouldFlip = this.aligner.flipped || (x > dw - w && spaceLeft > spaceRight)
				if (shouldFlip) {
					x = this.anchorRect.left - this.aligner.gaps.left - w
					this.flipDirections(computed, Direction.Left)
				}
			}
		}

		// Handle sticking to edges.
		if (this.aligner.options.stickToEdges) {

			// Move left a little to become fully visible.
			if (x + w > dw) {
				let gap = x + w - dw
				x -= gap
			}

			// Move right a little to become fully visible.
			else if (x < 0) {
				let gap = -x
				x += gap
			}
		}

		// Now transform to original origin.
		computed.target.position.x = x + dl
	}

	/** Align `triangle` relative to target. */
	private alignTriangle(computed: PositionComputed) {
		let fixedTriangle = this.aligner.options.fixedTriangle
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
		}

		if (!fixedTriangle) {
			if (computed.anchorFaceDirection.beVertical) {
				let x = this.computeTrianglePosition(
					this.targetRect.width,
					this.anchorRect.width, this.anchorRect.x - computed.target.position.x,
					triangleRelRect.width, triangleRelRect.x,
					this.targetBorderLeft,
					computed
				)

				transforms.push(`translateX(${x}px)`)
			}
			else if (computed.anchorFaceDirection.beHorizontal) {
				let y = this.computeTrianglePosition(
					this.targetRect.height,
					this.anchorRect.height, this.anchorRect.y - computed.target.position.y,
					triangleRelRect.height, triangleRelRect.y,
					this.targetBorderTop,
					computed
				)

				transforms.push(`translateY(${y}px)`)
			}
		}

		let triangleShouldFlip = computed.target.flipped
		if (triangleShouldFlip) {
			if (computed.anchorFaceDirection.beHorizontal) {
				transforms.push('scaleX(-1)')
			}
			else {
				transforms.push('scaleY(-1)')
			}
		}
			
		if (computed.anchorFaceDirection === Direction.Top) {
			computed.triangle.inset.top = 'auto'
			computed.triangle.inset.bottom = -triangleRelRect.height + 'px'
			computed.triangle.inset.left = fixedTriangle ? '' : '0'
		}
		else if (computed.anchorFaceDirection === Direction.Bottom) {
			computed.triangle.inset.top = -triangleRelRect.height + 'px'
			computed.triangle.inset.bottom = 'auto'
			computed.triangle.inset.left = fixedTriangle ? '' : '0'
		}
		else if (computed.anchorFaceDirection === Direction.Left) {
			computed.triangle.inset.left = 'auto'
			computed.triangle.inset.right = -triangleRelRect.width + 'px'
			computed.triangle.inset.top = fixedTriangle ? '' : '0'
		}
		else if (computed.anchorFaceDirection === Direction.Right) {
			computed.triangle.inset.left = -triangleRelRect.width + 'px'
			computed.triangle.inset.right = 'auto'
			computed.triangle.inset.top = fixedTriangle ? '' : '0'
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
		borderW: number,
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

		x -= borderW

		return x
	}
}
