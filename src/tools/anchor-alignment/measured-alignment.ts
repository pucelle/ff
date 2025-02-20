import {Direction} from '../../math'
import {DOMUtils} from '../../utils'
import {AnchorAligner} from '../anchor-aligner'
import {PositionComputed} from './position-computer'
import {getAnchorPointAt, getRelativeAnchorPointAt} from './position-gap-parser'
import {PureCSSComputed, PureCSSAnchorAlignment} from './pure-css-alignment'
import {AnchorAlignmentType} from './types'


/** It must do measurement firstly, then assign css properties. */
export class MeasuredAlignment {

	readonly type: AnchorAlignmentType = AnchorAlignmentType.Measured
	private aligner: AnchorAligner
	private target: HTMLElement
	private triangle: HTMLElement | undefined

	/** Whether applied CSS Anchor Positioning properties. */
	private useCSSAnchorPositioning: boolean = false

	/** Previously computed. */
	private lastComputed: PositionComputed | null = null

	/** To do css alignment. */
	private cssAlignment: PureCSSAnchorAlignment | null = null
	
	constructor(aligner: AnchorAligner) {
		this.aligner = aligner
		this.target = aligner.target
		this.triangle = aligner.options.triangle
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 */
	reset() {
		if (!this.lastComputed) {
			return
		}

		this.resetBeforeAlign()

		if (this.useCSSAnchorPositioning) {
			this.cssAlignment!.reset()
		}

		// Absolute element's layout will be affected by parent container.
		else {
			this.target.style.top = ''
			this.target.style.right = ''
			this.target.style.left = ''
		}

		// Restore triangle transform.
		if (this.lastComputed.triangle) {
			let triangle = this.triangle!

			triangle.style.top = ''
			triangle.style.right =''
			triangle.style.bottom = ''
			triangle.style.left = ''
			triangle.style.transform = ''
		}
	}

	/** Do reset before each time align. */
	resetBeforeAlign() {
		if (!this.lastComputed) {
			return
		}
		
		// Restore original target height.
		if (this.lastComputed.target.limitHeight) {
			this.target.style.height = ''
		}
	}

	/** 
	 * Align content after known both rects.
	 * Should wait for all dom write operations completed.
	 */
	align(computed: PositionComputed) {
		this.useCSSAnchorPositioning = this.aligner.canApplyCSSAnchorPositioning()

		if (this.useCSSAnchorPositioning) {
			this.applyCSSAnchorPositioningProperties(computed)
		}
		else {
			this.applyCSSPositionProperties(computed)
		}

		this.applyTargetProperties(computed)
		this.applyTriangleProperties(computed)
		this.lastComputed = computed
	}

	private applyCSSAnchorPositioningProperties(computed: PositionComputed) {
		if (!this.cssAlignment) {
			this.cssAlignment = new PureCSSAnchorAlignment(this.aligner)
		}

		let anchorPoint = getAnchorPointAt(computed.anchor.rect, computed.anchorDirection)
		let targetPoint = getRelativeAnchorPointAt(computed.target.rect, computed.targetDirection)

		let targetTranslate: Coord = {
			x: computed.target.position.x - (anchorPoint.x - targetPoint.x),
			y: computed.target.position.y - (anchorPoint.y - targetPoint.y),
		}

		let cssComputed: PureCSSComputed = {
			anchorDirection: computed.anchorDirection,
			targetDirection: computed.targetDirection,
			targetTranslate,
		}

		this.cssAlignment.align(cssComputed)
	}

	private applyCSSPositionProperties(computed: PositionComputed) {
		let {x, y} = computed.target.position
		let targetInAbsolutePosition = DOMUtils.getStyleValue(this.target, 'position') === 'absolute'

		// For absolute layout content, convert x, y to absolute position.
		if (targetInAbsolutePosition
			&& this.aligner.anchor !== document.body
			&& this.aligner.anchor !== document.documentElement
		) {
			var offsetParent = this.target.offsetParent as HTMLElement

			// If we use body's top position, it will cause a bug when body has a margin top (even from margin collapse).
			if (offsetParent) {
				var parentRect = offsetParent.getBoundingClientRect()
				x -= parentRect.left
				y -= parentRect.top
			}
		}

		// May scrollbar appears after alignment,
		// such that it should align to right.
		if (computed.anchorFaceDirection === Direction.Left) {
			this.target.style.left = 'auto'
			this.target.style.right = document.documentElement.clientWidth - computed.target.rect.right + 'px'
		}
		else {
			this.target.style.left = x + 'px'
			this.target.style.right = 'auto'
		}

		this.target.style.top = y + 'px'
	}

	private applyTargetProperties(computed: PositionComputed) {
		if (computed.target.limitHeight) {
			this.target.style.height = computed.target.limitHeight + 'px'
		}
	}

	private applyTriangleProperties(computed: PositionComputed) {
		let triangle = this.aligner.options.triangle
		if (!triangle || !computed.triangle) {
			return
		}

		triangle.style.top = computed.triangle.inset.top
		triangle.style.right = computed.triangle.inset.right
		triangle.style.bottom = computed.triangle.inset.bottom
		triangle.style.left = computed.triangle.inset.left

		triangle.style.transform = computed.triangle.transform
	}
}