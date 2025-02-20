import {Direction} from '../../math'
import {AnchorAligner} from '../anchor-aligner'
import {AnchorAlignmentType} from './types'


/** Pure CSS computed position for PureCSSAnchorAlignment to do alignment. */
export interface PureCSSComputed {
	anchorDirection: Direction
	targetTranslate: Coord
}


let ElementAnchorNameSeed = 1
const ElementAnchorNameMap: WeakMap<HTMLElement, string> = new WeakMap()

function getElementAnchorName(el: HTMLElement): string | undefined {
	return ElementAnchorNameMap.get(el)
}

function getNewElementAnchorName(): string {
	return '--anchor-' + (ElementAnchorNameSeed++)
}

function setElementAnchorName(el: HTMLElement, name: string) {
	el.style.setProperty('anchor-name', name)
	return ElementAnchorNameMap.set(el, name)
}


/** Do CSS Anchor alignment by Anchor Positioning APIs. */
export class PureCSSAnchorAlignment {
	
	readonly type: AnchorAlignmentType = AnchorAlignmentType.Measured
	private aligner: AnchorAligner
	private target: HTMLElement
	private anchorName: string
	private lastTransform: string = ''

	/** Can only write to dom properties after initialized. */
	constructor(aligner: AnchorAligner) {
		this.aligner = aligner
		this.target = this.aligner.target

		let anchor = this.aligner.anchor as HTMLElement
		let anchorName = getElementAnchorName(this.aligner.anchor as HTMLElement)
		
		if (!anchorName) {
			anchorName = this.aligner.options.name || getNewElementAnchorName()
			anchor.style.setProperty('anchor-name', anchorName)
			setElementAnchorName(this.aligner.anchor as HTMLElement, anchorName)
		}

		this.anchorName = anchorName
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 */
	reset() {
		if (this.lastTransform) {
			this.target.style.setProperty('transform', '')
		}
	}

	align(computed: PureCSSComputed) {
		let target = this.target
		let anchorD = computed.anchorDirection
		let targetD = this.aligner.targetDirection
		let anchorH = anchorD.horizontal.toBoxEdgeKey() ?? 'center'
		let anchorV = anchorD.vertical.toBoxEdgeKey() ?? 'center'
		let targetH = targetD.horizontal.toBoxEdgeKey() ?? 'center'
		let targetV = targetD.vertical.toBoxEdgeKey() ?? 'center'
		let targetTranslate = computed.targetTranslate
		let transform = ''

		target.style.setProperty('position-visibility', 'anchors-visible')
		target.style.setProperty(targetH === 'center' ? 'left' : targetH, `anchor(${this.anchorName} ${anchorH})`)
		target.style.setProperty(targetV === 'center' ? 'top' : targetV, `anchor(${this.anchorName} ${anchorV})`)

		// When align to center, no gap transform assigned.
		if (targetH === 'center' && targetV === 'center') {
			target.style.setProperty('position-anchor', this.anchorName)
			target.style.setProperty('position-area', 'center')
		}
		else if (targetH === 'center') {
			transform = 'translateX(-50%)'
		}
		else if (targetV === 'center') {
			transform = 'translateY(-50%)'
		}

		if (targetTranslate.x !== 0 || targetTranslate.y !== 0) {
			transform += `translate(${targetTranslate.x}px, ${targetTranslate.y}px)`
		}

		this.lastTransform = transform
		target.style.setProperty('transform', transform)
	}
}