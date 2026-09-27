import {Direction} from '../../math'
import {AnchorAligner} from './anchor-aligner'
import {PositionComputed} from './helpers/position-computer'
import {isTargetUsingByAligner} from './helpers/target-aligner'


/** It must do measurement firstly, then assign css properties. */
export class MeasuredAlignment {

	private aligner: AnchorAligner
	private target: HTMLElement
	private triangle: HTMLElement | undefined

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
		let targetInUsing = isTargetUsingByAligner(this.target, this.aligner)

		// Absolute element's layout will be affected by parent container.
		if (targetInUsing) {
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
		this.applyCSSPositionProperties(computed)
		this.applyTargetProperties(computed)
		this.applyTriangleProperties(computed)
		this.lastComputed = computed
	}

	private applyCSSPositionProperties(computed: PositionComputed) {
		let {x, y} = computed.target.position

		// Convert from fixed positioning to absolute positioning.
		if (computed.target.absolutePositionOffset) {
			x += computed.target.absolutePositionOffset.x
			y += computed.target.absolutePositionOffset.y
		}

		// May scrollbar appears after alignment,
		// such that it should align to right.
		if (computed.anchorFaceDirection === Direction.Left) {

			// Target rect position is not final position.
			let right = x + computed.target.rect.width

			this.target.style.left = 'auto'
			this.target.style.right = document.documentElement.clientWidth - right + 'px'
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