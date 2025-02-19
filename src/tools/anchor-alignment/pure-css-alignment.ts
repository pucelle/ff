import {AnchorAligner} from '../anchor-aligner'
import {getGapTranslate} from './position-gap-parser'
import {AnchorAlignmentType} from './types'


/** Do CSS Anchor alignment by Anchor Positioning APIs. */
export class PureCSSAnchorAlignment {
	
	readonly type: AnchorAlignmentType = AnchorAlignmentType.Measured
	private aligner: AnchorAligner
	private target: HTMLElement

	constructor(aligner: AnchorAligner) {
		this.aligner = aligner
		this.target = this.aligner.target
	}

	align() {
		this.setAnchorProperties()
		this.setTryFallbacks()
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 */
	reset() {
		this.target.style.setProperty('transform', '')
	}

	private setAnchorProperties() {
		let aligner = this.aligner
		let target = this.target
		let anchorD = this.aligner.anchorDirection
		let targetD = this.aligner.targetDirection
		let anchorH = anchorD.horizontal.toBoxEdgeKey() ?? 'center'
		let anchorV = anchorD.vertical.toBoxEdgeKey() ?? 'center'
		let targetH = targetD.horizontal.toBoxEdgeKey() ?? 'center'
		let targetV = targetD.vertical.toBoxEdgeKey() ?? 'center'
		let anchor = aligner.anchor as HTMLElement
		let gap = getGapTranslate(anchorD, this.aligner.gaps)

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

	private setTryFallbacks() {
		let aligner = this.aligner
		let flipDirection = aligner.options.flipDirection
		let fallback: string = ''
		let target = aligner.target

		if (flipDirection === 'horizontal') {
			fallback = 'flip-inline'
		}
		else if (flipDirection === 'vertical') {
			fallback = 'flip-block'
		}
		else if (flipDirection === 'auto') {
			if (aligner.anchorFaceDirection.beHorizontal) {
				fallback = 'flip-inline'
			}
			else if (aligner.anchorFaceDirection.beVertical) {
				fallback = 'flip-block'
			}
		}
		
		target.style.setProperty('position-visibility', 'anchors-visible')
		target.style.setProperty('position-try-fallbacks', fallback)
	}
}