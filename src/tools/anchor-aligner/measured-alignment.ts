import {Direction, Vector} from '../../math'
import {barrierDOMWriting} from '../barrier-queue'
import {AnchorAligner} from './anchor-aligner'
import {PositionComputed} from './helpers/position-computer'
import {getAnchorPointAt, getRelativeAnchorPointAt} from './helpers/position-gap-parser'
import {isTargetUsingByAligner} from './helpers/target-aligner'
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
	
	constructor(aligner: AnchorAligner, useCSSAnchorPositioning: boolean) {
		this.aligner = aligner
		this.useCSSAnchorPositioning = useCSSAnchorPositioning
		this.target = aligner.target
		this.triangle = aligner.options.triangle
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 */
	async reset() {
		if (!this.lastComputed) {
			return
		}

		await barrierDOMWriting()

		this.resetBeforeAlign()

		let targetInUsing = isTargetUsingByAligner(this.target, this.aligner)

		if (this.useCSSAnchorPositioning) {
			this.cssAlignment!.reset()
		}

		// Absolute element's layout will be affected by parent container.
		else if (targetInUsing) {
			this.target.style.top = ''
			this.target.style.right = ''
			this.target.style.left = ''
		}

		// Restore triangle transform.
		if (targetInUsing && this.lastComputed.triangle) {
			let triangle = this.triangle!

			triangle.style.top = ''
			triangle.style.right =''
			triangle.style.bottom = ''
			triangle.style.left = ''
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
	 * Align content after get computed position.
	 * Ensure to barrier DOM Writing before calling it.
	 */
	align(computed: PositionComputed) {
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

		let targetTranslate = new Vector(
			computed.target.position.x - (anchorPoint.x - targetPoint.x),
			computed.target.position.y - (anchorPoint.y - targetPoint.y)
		)

		let cssComputed: PureCSSComputed = {
			anchorDirection: computed.anchorDirection,
			targetDirection: computed.targetDirection,
			targetRect: computed.target.rect,
			targetTranslate,
		}

		this.cssAlignment.align(cssComputed)
	}

	private applyCSSPositionProperties(computed: PositionComputed) {
		let {x, y} = computed.target.position

		// Convert from fixed positioning to absolute positioning.
		if (computed.target.absolutePositionOffset) {
			x += computed.target.absolutePositionOffset.x
			y += computed.target.absolutePositionOffset.x
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