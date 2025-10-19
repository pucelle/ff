import {Direction, BoxOffsets, Vector} from '../../math'
import {WeakListMap} from '../../structs'
import {AnchorAligner} from './anchor-aligner'
import {AnchorAlignmentType} from './types'


/** Pure CSS computed position for PureCSSAnchorAlignment to do alignment. */
export interface PureCSSComputed {
	anchorDirection: Direction
	targetDirection: Direction
	targetRect: DOMRect
	targetTranslate: Vector
}


interface PositionAreaAndTranslate {
	areaV: string
	areaH: string
	targetTranslate: Vector
}


let ElementAnchorNameSeed = 1
const ElementAnchorNameMap: WeakMap<HTMLElement, string> = /*#__PURE__*/new WeakMap()
const ElementAnchorReferenceBy: WeakListMap<HTMLElement, PureCSSAnchorAlignment> = /*#__PURE__*/new WeakListMap()

function getElementAnchorName(el: HTMLElement): string | undefined {
	return ElementAnchorNameMap.get(el)
}

function getNewElementAnchorName(): string {
	return '--anchor-' + (ElementAnchorNameSeed++)
}

function setElementAnchorName(el: HTMLElement, name: string, refBy: PureCSSAnchorAlignment) {
	el.style.setProperty('anchor-name', name)
	ElementAnchorNameMap.set(el, name)
	ElementAnchorReferenceBy.add(el, refBy)
}

function deleteElementAnchorName(el: HTMLElement, refBy: PureCSSAnchorAlignment) {
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
		for (let key of BoxOffsets.Keys) {
			this.target.style[key] = ''
		}

		this.target.style.setProperty('position-anchor', '')
		this.target.style.setProperty('position-area', '')
		//this.target.style.setProperty('position-visibility', '')

		deleteElementAnchorName(this.anchor, this)
	}

	/**
	 * Align content after get computed position.
	 * Ensure to barrier DOM Writing before calling it.
	 */
	align(computed: PureCSSComputed) {
		let areaAndTranslate = this.mapPositionToAreaAndTranslate(computed)
		this.setPositionProperties(computed, areaAndTranslate)
	}

	private mapPositionToAreaAndTranslate(computed: PureCSSComputed): PositionAreaAndTranslate {
		let targetD = computed.targetDirection
		let anchorD = computed.anchorDirection
		let primaryD = anchorD.joinToStraight(targetD.opposite)
		let anchorSecondaryD = anchorD.joinToStraight(primaryD.opposite)
		let targetSecondaryD = targetD.joinToStraight(primaryD)
		let areaV: string
		let areaH: string
		let targetTranslate = new Vector()

		// Faced directions like `left, top, top left, center`.
		if (targetD.isOppositeOf(anchorD)) {
			if (anchorD === Direction.Center) {
				areaV = 'center'
				areaH = 'center'
			}
			else if (anchorD.beHorizontal) {
				areaV = 'center'
				areaH = anchorD.toBoxOffsetKey()!
			}
			else if (anchorD.beVertical) {
				areaV = anchorD.toBoxOffsetKey()!
				areaH = 'center'
			}
			else {
				[areaV, areaH] = anchorD.toBoxOffsetKeys()
			}
		}

		// Span directions like `span-top left, bottom span-left`
		else {

			// `top span-left`
			if (primaryD.beVertical && anchorSecondaryD !== Direction.Center) {
				areaV = primaryD.toBoxOffsetKey()!
				areaH = 'span-' + anchorSecondaryD.opposite.toBoxOffsetKey()!
			}

			// `span-top left`
			else if (primaryD.beHorizontal && anchorSecondaryD !== Direction.Center) {
				areaV = 'span-' + anchorSecondaryD.opposite.toBoxOffsetKey()!
				areaH = primaryD.toBoxOffsetKey()!
			}

			// `span-top center`
			else if (anchorD.beStraight) {
				areaV = 'span-' + anchorD.opposite.toBoxOffsetKey()!
				areaH = 'center'
			}

			// `span-top span-left`
			else {
				areaV = 'span-' + anchorD.vertical.opposite.toBoxOffsetKey()!
				areaH = 'span-' + anchorD.horizontal.opposite.toBoxOffsetKey()!
			}

			if (anchorSecondaryD !== targetSecondaryD) {
				targetTranslate = anchorSecondaryD.toAnchorVector().sub(targetSecondaryD.toAnchorVector())
			}
		}

		return {
			areaV: areaV,
			areaH: areaH,
			targetTranslate,
		}
	}
	
	private setPositionProperties(computed: PureCSSComputed, areaAndTranslate: PositionAreaAndTranslate) {
		let target = this.target
		let alignTranslate = computed.targetTranslate
		let {targetTranslate, areaV, areaH} = areaAndTranslate
		let translate = new Vector()

		target.style.setProperty('position-area', areaV + ' ' + areaH)
		
		// Transform not affect anchor positioning, but position does.
		translate.x += targetTranslate.x * computed.targetRect.width
		translate.y += targetTranslate.y * computed.targetRect.height
		translate.addSelf(alignTranslate)
		
		if (areaH === 'left' || areaH === 'span-left') {
			target.style.setProperty('right', -translate.x + 'px')
			target.style.setProperty('left', '')
		}
		else if (areaH !== 'center') {
			target.style.setProperty('left', translate.x + 'px')
			target.style.setProperty('right', '')
		}

		if (areaV === 'top' || areaV === 'span-top') {
			target.style.setProperty('bottom', -translate.y + 'px')
			target.style.setProperty('top', '')
		}
		else if (areaV !== 'center') {
			target.style.setProperty('top', translate.y + 'px')
			target.style.setProperty('bottom', '')
		}
	}
}
