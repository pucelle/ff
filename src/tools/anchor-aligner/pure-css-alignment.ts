import {Direction, BoxOffsets, Vector, BoxOffsetKey} from '../../math'
import {AnchorAligner} from './anchor-aligner'
import {deleteElementAnchorName, getElementAnchorName, getNewElementAnchorName, setElementAnchorName} from './helpers/anchor-names'
import {isTargetUsingByAligner} from './helpers/target-aligner'
import {AnchorAlignmentType} from './types'


/** Pure CSS computed position for PureCSSAnchorAlignment to do alignment. */
export interface PureCSSComputed {
	anchorDirection: Direction
	targetDirection: Direction
	targetRect: DOMRect
	targetTranslate: Vector
}

/** Do CSS Anchor alignment by Anchor Positioning APIs. */
export class PureCSSAnchorAlignment {
	
	readonly type: AnchorAlignmentType = AnchorAlignmentType.Measured
	private aligner: AnchorAligner
	private anchor: HTMLElement
	private target: HTMLElement
	private anchorName: string

	/** Can only write to dom properties after initialized. */
	constructor(aligner: AnchorAligner) {
		this.aligner = aligner
		this.anchor = aligner.anchor as HTMLElement
		this.target = this.aligner.target

		let anchorName = getElementAnchorName(this.anchor)
		
		if (!anchorName) {
			anchorName = this.aligner.options.name || getNewElementAnchorName()
			setElementAnchorName(this.anchor, anchorName, this)
		}

		this.anchorName = anchorName
		this.target.style.setProperty('position-anchor', this.anchorName)

		// Test shows when scrolled, elements will become not visible.
		//this.target.style.setProperty('position-visibility', 'anchors-visible')
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 * Ensure barrier DOM Writing before calling it.
	 */
	reset() {
		let targetInUsing = isTargetUsingByAligner(this.target, this.aligner)
		if (targetInUsing) {
			for (let key of BoxOffsets.Keys) {
				this.target.style[key] = ''
			}

			this.target.style.setProperty('position-anchor', '')
			this.target.style.setProperty('position-area', '')
			//this.target.style.setProperty('position-visibility', '')
		}

		deleteElementAnchorName(this.anchor, this)
	}

	align(computed: PureCSSComputed) {
		this.setPosition(computed)
		this.setTransform(computed)
	}

	/** Set `position: anchor(...)`. */
	private setPosition(computed: PureCSSComputed) {
		let target = this.target
		let anchorD = computed.anchorDirection
		let targetD = computed.targetDirection
		let anchorInsetKeyH = anchorD.horizontal.toBoxOffsetKey() ?? 'center'
		let anchorInsetKeyV = anchorD.vertical.toBoxOffsetKey() ?? 'center'
		let targetInsetKeyH = targetD.horizontal.toBoxOffsetKey() ?? 'center'
		let targetInsetKeyV = targetD.vertical.toBoxOffsetKey() ?? 'center'

		let targetInsetKeyHNonCenter = targetInsetKeyH === 'center' ? 'left' : targetInsetKeyH
		let targetInsetKeyVNonCenter = targetInsetKeyV === 'center' ? 'top' : targetInsetKeyV
		let otherInsetKeys: BoxOffsetKey[] = BoxOffsets.Keys.filter(key => key !== targetInsetKeyHNonCenter && key !== targetInsetKeyVNonCenter)

		target.style.setProperty(targetInsetKeyHNonCenter, `anchor(${this.anchorName} ${anchorInsetKeyH})`)
		target.style.setProperty(targetInsetKeyVNonCenter, `anchor(${this.anchorName} ${anchorInsetKeyV})`)

		for (let otherKey of otherInsetKeys) {
			this.target.style[otherKey] = 'auto'
		}
	}
	
	/** Set transform values. */
	private setTransform(computed: PureCSSComputed) {
		let target = this.target
		let targetD = this.aligner.targetDirection
		let targetInsetKeyH = targetD.horizontal.toBoxOffsetKey() ?? 'center'
		let targetInsetKeyV = targetD.vertical.toBoxOffsetKey() ?? 'center'
		let targetTranslate = computed.targetTranslate
		let transform = ''

		// When align to center, no gap transform assigned.
		if (targetInsetKeyH === 'center' && targetInsetKeyV === 'center') {
			target.style.setProperty('position-anchor', this.anchorName)
			target.style.setProperty('position-area', 'center')
		}
		else if (targetInsetKeyH === 'center') {
			transform = 'translateX(-50%)'
			target.style.setProperty('position-anchor', '')
			target.style.setProperty('position-area', '')
		}
		else if (targetInsetKeyV === 'center') {
			transform = 'translateY(-50%)'
			target.style.setProperty('position-anchor', '')
			target.style.setProperty('position-area', '')
		}

		if (targetTranslate.x !== 0 || targetTranslate.y !== 0) {
			transform += `translate(${targetTranslate.x}px, ${targetTranslate.y}px)`
		}

		target.style.setProperty('transform', transform)
	}
}
