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