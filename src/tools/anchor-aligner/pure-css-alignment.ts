import {Direction, Inset, Vector} from '../../math'
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
	area: string
	targetTranslate: Vector
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
		this.target.style.setProperty('position-anchor', this.anchorName)
	}

	/** 
	 * Reset css properties after stopping alignment.
	 * Or toggle alignment class.
	 * `align` repetitively with same alignment class will not cause reset.
	 */
	reset() {
		for (let key of Inset.Keys) {
			this.target.style[key] = ''
		}

		this.target.style.setProperty('position-visibility', '')
		this.target.style.setProperty('position-anchor', '')
		this.target.style.setProperty('position-area', '')

		deleteElementAnchorName(this.anchor, this)
	}

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
		let area: string
		let targetTranslate = new Vector()

		// Faced directions like `left, top, top left, center`.
		if (targetD.isOppositeOf(anchorD)) {
			area = anchorD === Direction.Center ? 'center' : anchorD.toInsetKeys().join(' ')
		}

		// Span directions like `span-top left, bottom span-left`
		else {

			// `top span-left`
			if (primaryD.beVertical && anchorSecondaryD !== Direction.Center) {
				area = primaryD.toInsetKey()!
					+ ' span-' + anchorSecondaryD.opposite.toInsetKey()!
			}

			// `span-top left`
			else if (primaryD.beHorizontal && anchorSecondaryD !== Direction.Center) {
				area = 'span-' + anchorSecondaryD.opposite.toInsetKey()!
					+ ' ' + primaryD.toInsetKey()!
			}

			// `span-top`
			else if (anchorD.beStraight) {
				area = 'span-' + anchorD.opposite.toInsetKey()!
			}

			// `span-top span-left`
			else {
				area = 'span-' + anchorD.vertical.opposite.toInsetKey()!
					+ ' span-' + anchorD.horizontal.opposite.toInsetKey()!
			}

			if (anchorSecondaryD !== targetSecondaryD) {
				targetTranslate = anchorSecondaryD.toAnchorVector().sub(targetSecondaryD.toAnchorVector())
			}
		}

		return {
			area,
			targetTranslate,
		}
	}
	
	private setPositionProperties(computed: PureCSSComputed, areaAndTranslate: PositionAreaAndTranslate) {
		let target = this.target
		let alignTranslate = computed.targetTranslate
		let areaTranslate = areaAndTranslate.targetTranslate
		let targetD = computed.targetDirection
		let anchorD = computed.anchorDirection
		let primaryD = anchorD.joinToStraight(targetD.opposite)
		let translate = new Vector()

		target.style.setProperty('position-area', areaAndTranslate.area)
		
		// Transform not affect anchor positioning, but position does.
		translate.x += areaTranslate.x * computed.targetRect.width
		translate.y += areaTranslate.y * computed.targetRect.height
		translate.addSelf(alignTranslate)

		if (primaryD === Direction.Right || primaryD === Direction.Bottom) {
			target.style.setProperty('left', translate.x + 'px')
			target.style.setProperty('top', translate.y + 'px')
			target.style.setProperty('right', '')
			target.style.setProperty('bottom', '')
		}
		else if (primaryD === Direction.Left) {
			target.style.setProperty('right', -translate.x + 'px')
			target.style.setProperty('top', translate.y + 'px')
			target.style.setProperty('left', '')
			target.style.setProperty('bottom', '')
		}
		else if (primaryD === Direction.Top) {
			target.style.setProperty('left', translate.x + 'px')
			target.style.setProperty('bottom', -translate.y + 'px')
			target.style.setProperty('right', '')
			target.style.setProperty('top', '')
		}
	}
}
