import {Box, HVDirection} from '../../../math'
import {AnchorAligner} from '../anchor-aligner'


const TargetAlignerMap: WeakMap<Element, AnchorAligner> = /*#__PURE__*/new WeakMap()


export function setTargetAlignerMap(target: Element, aligner: AnchorAligner) {
	let existingAligner = TargetAlignerMap.get(target)

	// Stop previous aligner which using target.
	if (existingAligner) {
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
export function computeReAnchoredOrTargetedRect(containerRect: DOMRect, reRect: DOMRect, hvDirection: HVDirection | null, willExpand: boolean): DOMRect {
	if (containerRect === reRect) {
		return containerRect
	}
	
	let faceHV = hvDirection
	if (faceHV !== null && willExpand) {
		reRect = Box.fromLike(reRect).unionAtHVSelf(Box.fromLike(containerRect), faceHV)
	}

	return reRect
}
