import {Direction} from '../../math'
import {DOMUtils} from '../../utils'
import {AnchorAligner} from '../anchor-aligner'
import {PositionComputed, PositionComputer} from './position-computer'
import {AnchorAlignmentType} from './types'


/** It must do measurement firstly, then assign css properties. */
export class MeasuredAlignment {

	readonly type: AnchorAlignmentType = AnchorAlignmentType.Measured
	private aligner: AnchorAligner
	private target: HTMLElement
	private triangle: HTMLElement | undefined

	/** Whether applied CSS Anchor Positioning properties. */
	private useCSSAnchorPositioning: boolean = false

	/** Whether target element use fixed position. */
	private targetInAbsolutePosition: boolean | null = null

	/** Previously computed. */
	private lastComputed: PositionComputed | null = null
	
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

		// Absolute element's layout will be affected by parent container.
		if (this.targetInAbsolutePosition) {
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
	align(anchorRect: DOMRect) {
		this.useCSSAnchorPositioning = this.aligner.canApplyCSSAnchorPositioning()
		this.targetInAbsolutePosition = DOMUtils.getStyleValue(this.target, 'position') === 'absolute'

		let computer = new PositionComputer(this.aligner, anchorRect)
		let computed = computer.compute()

		if (this.useCSSAnchorPositioning) {
			this.applyCSSAnchorPositioningProperties(computed)
		}
		else {
			this.applyCSSPositionProperties(computed)
		}

		this.applyTargetProperties(computed)
		this.applyTriangleProperties(computed)
	}

	private applyCSSAnchorPositioningProperties(computed: PositionComputed) {
		let {x, y} = computed.target.position

		let aligner = this.aligner
		let target = this.target
		let anchorD = this.aligner.anchorDirection
		let targetD = this.aligner.targetDirection
		let anchorH = anchorD.horizontal.toBoxEdgeKey() ?? 'center'
		let anchorV = anchorD.vertical.toBoxEdgeKey() ?? 'center'
		let targetH = targetD.horizontal.toBoxEdgeKey() ?? 'center'
		let targetV = targetD.vertical.toBoxEdgeKey() ?? 'center'
		let anchor = aligner.anchor as HTMLElement

		anchor.style.setProperty('anchor-name', aligner.anchorName)

		target.style.setProperty(targetH === 'center' ? 'left' : targetH, `anchor(${aligner.anchorName} ${anchorH})`)
		target.style.setProperty(targetV === 'center' ? 'top' : targetV, `anchor(${aligner.anchorName} ${anchorV})`)

		// When align to center, no gap assigned.
		if (targetH === 'center' && targetV === 'center') {
			target.style.setProperty('position-anchor', aligner.anchorName)
			target.style.setProperty('position-area', 'center')
			target.style.setProperty('transform', '')
		}
		else if (targetH === 'center') {
			target.style.setProperty('transform', 'translateX(-50%)')
		}
		else if (targetV === 'center') {
			target.style.setProperty('transform', 'translateY(-50%)')
		}
		else {
			let transform = ''
			
			if (gap.x || gap.y) {
				transform += `translate(${gap.x}px, ${gap.y}px)`
			}

			target.style.setProperty('transform', transform)
		}
	}

	private applyCSSPositionProperties(computed: PositionComputed) {
		let {x, y} = computed.target.position

		// For absolute layout content, convert x, y to absolute position.
		if (this.targetInAbsolutePosition
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