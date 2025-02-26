import {Direction, Inset} from '../../math'
import {WeakListMap} from '../../structs'
import {AnchorAligner} from './anchor-aligner'
import {AnchorAlignmentType} from './types'


/** Pure CSS computed position for PureCSSAnchorAlignment to do alignment. */
export interface PureCSSComputed {
	anchorDirection: Direction
	targetDirection: Direction
	targetTranslate: Coord
}


let ElementAnchorNameSeed = 1
const ElementAnchorNameMap: WeakMap<HTMLElement, string> = new WeakMap()
const ElementAnchorReferenceBy: WeakListMap<HTMLElement, any> = new WeakListMap()

function getElementAnchorName(el: HTMLElement): string | undefined {
	return ElementAnchorNameMap.get(el)
}

function getNewElementAnchorName(): string {
	return '--anchor-' + (ElementAnchorNameSeed++)
}

function setElementAnchorName(el: HTMLElement, name: string, refBy: any) {
	el.style.setProperty('anchor-name', name)
	ElementAnchorNameMap.set(el, name)
	ElementAnchorReferenceBy.add(el, refBy)
}

function deleteElementAnchorName(el: HTMLElement, refBy: any) {
	ElementAnchorReferenceBy.delete(el, refBy)

	// Has no reference at all.
	if (!ElementAnchorReferenceBy.hasKey(el)) {
		ElementAnchorNameMap.delete(el)
		el.style.setProperty('anchor-name', '')
	}
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
		this.target.style.setProperty('position-visibility', 'anchors-visible')
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 */
	reset() {
		this.target.style.setProperty('transform', '')

		for (let key of Inset.Keys) {
			this.target.style[key] = ''
		}

		this.target.style.setProperty('position-visibility', '')
		this.target.style.setProperty('position-anchor', '')
		this.target.style.setProperty('position-area', '')

		deleteElementAnchorName(this.anchor, this)
	}

	align(computed: PureCSSComputed) {
		this.setInsetValues(computed)
		this.setTransform(computed)
	}

	private setInsetValues(computed: PureCSSComputed) {
		let target = this.target
		let anchorD = computed.anchorDirection
		let targetD = computed.targetDirection
		let anchorInsetKeyH = anchorD.horizontal.toInsetKey() ?? 'center'
		let anchorInsetKeyV = anchorD.vertical.toInsetKey() ?? 'center'
		let targetInsetKeyH = targetD.horizontal.toInsetKey() ?? 'center'
		let targetInsetKeyV = targetD.vertical.toInsetKey() ?? 'center'

		let targetInsetKeyHNonCenter = targetInsetKeyH === 'center' ? 'left' : targetInsetKeyH
		let targetInsetKeyVNonCenter = targetInsetKeyV === 'center' ? 'top' : targetInsetKeyV
		let otherInsetKeys: InsetKey[] = Inset.Keys.filter(key => key !== targetInsetKeyHNonCenter && key !== targetInsetKeyVNonCenter)

		target.style.setProperty(targetInsetKeyHNonCenter, `anchor(${this.anchorName} ${anchorInsetKeyH})`)
		target.style.setProperty(targetInsetKeyVNonCenter, `anchor(${this.anchorName} ${anchorInsetKeyV})`)

		for (let otherKey of otherInsetKeys) {
			this.target.style[otherKey] = 'auto'
		}
	}
	
	private setTransform(computed: PureCSSComputed) {
		let target = this.target
		let targetD = this.aligner.targetDirection
		let targetInsetKeyH = targetD.horizontal.toInsetKey() ?? 'center'
		let targetInsetKeyV = targetD.vertical.toInsetKey() ?? 'center'
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