import {Box, HVDirection} from '../../../math'
import {AnchorAligner} from '../anchor-aligner'


const TargetAlignerMap: WeakMap<Element, AnchorAligner> = /*#__PURE__*/new WeakMap()


/** When different trigger share same popups, stop old aligner. */
export function setTargetAlignerMap(target: Element, aligner: AnchorAligner) {
	let existingAligner = TargetAlignerMap.get(target)

	// Stop previous aligner which using target.
	if (existingAligner && existingAligner !== aligner) {
		existingAligner.stop()
	}

	TargetAlignerMap.set(target, aligner)
}

export function deleteTargetAlignerMap(target: Element, aligner: AnchorAligner) {
	if (TargetAlignerMap.get(target) === aligner) {
		TargetAlignerMap.delete(target)
	}
}

export function isTargetUsingByAligner(target: Element, aligner: AnchorAligner) {
	return TargetAlignerMap.get(target) === aligner
}

/** Compute a new rect by extending `toAlignRect` at face direction and it's opposite. */
export function computeReAnchoredOrTargetedRect(
	anchorRect: DOMRect,
	reRect: DOMRect,
	hvDirection: HVDirection | null,
	willExpand: boolean,
	parental: boolean = false
): DOMRect {
	if (anchorRect === reRect) {
		return anchorRect
	}
	
	let faceHV = hvDirection
	if (faceHV !== null && willExpand) {

		// A parental anchor contributes only on the face axis.
		// keep the trigger's other axis.
		reRect = parental
			? Box.fromLike(anchorRect).unionAtHVSelf(Box.fromLike(reRect), faceHV)
			: Box.fromLike(reRect).unionAtHVSelf(Box.fromLike(anchorRect), faceHV)
	}

	return reRect
}
