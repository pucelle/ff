import {WeakListMap} from '../../../structs'
import {PureCSSAnchorAlignment} from '../pure-css-alignment'


let ElementAnchorNameSeed = 1
const ElementAnchorNameMap: WeakMap<HTMLElement, string> = /*#__PURE__*/new WeakMap()
const ElementAnchorReferenceBy: WeakListMap<HTMLElement, PureCSSAnchorAlignment> = /*#__PURE__*/new WeakListMap()


export function getElementAnchorName(el: HTMLElement): string | undefined {
	return ElementAnchorNameMap.get(el)
}

export function getNewElementAnchorName(): string {
	return '--anchor-' + (ElementAnchorNameSeed++)
}

export function setElementAnchorName(el: HTMLElement, name: string, refBy: PureCSSAnchorAlignment) {
	el.style.setProperty('anchor-name', name)
	ElementAnchorNameMap.set(el, name)
	ElementAnchorReferenceBy.add(el, refBy)
}

export function deleteElementAnchorName(el: HTMLElement, refBy: PureCSSAnchorAlignment) {
	ElementAnchorReferenceBy.delete(el, refBy)

	// Has no reference at all.
	if (!ElementAnchorReferenceBy.hasKey(el)) {
		ElementAnchorNameMap.delete(el)
		el.style.setProperty('anchor-name', '')
	}
}
