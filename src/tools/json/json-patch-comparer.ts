import {clone, isRecord, memberKey, sameValue, selectors} from './json-patch-common'
import type {JSONPatch, JSONPatchCompareOptions, JSONPatchPath} from './json-patch-common'


/** Compare two values and describe their differences as a patch. */
export function compareJSONPatch(before: unknown, after: unknown, options: JSONPatchCompareOptions = {}): JSONPatch {
	let maxDepth = options.maxDepth ?? Infinity
	if (maxDepth < 0 || maxDepth !== Infinity && !Number.isInteger(maxDepth)) {
		throw new RangeError('Maximum patch depth must be a nonnegative integer or Infinity')
	}

	let patch: JSONPatch = []
	collect(before, after, [], patch, options)
	return patch
}

/** Compare objects recursively and arrays by member selectors. */
function collect(before: any, after: any, path: JSONPatchPath, patch: JSONPatch, options: JSONPatchCompareOptions) {
	if (path.length >= (options.maxDepth ?? Infinity)) {
		if (!sameValue(before, after)) {
			replaceValue(after, path, patch)
		}

		return
	}

	if (sameValue(before, after)) {
		return
	}

	if (isRecord(before) && isRecord(after)) {
		let keys = new Set([...Object.keys(before), ...Object.keys(after)])

		for (let key of keys) {
			let memberPath = [...path, key]

			if (before[key] !== undefined && after[key] !== undefined) {
				collect(before[key], after[key], memberPath, patch, options)
			}
			else if (after[key] !== undefined) {
				patch.push({type: 'set', path: memberPath, after: clone(after[key])})
			}
			else if (before[key] !== undefined) {
				patch.push({type: 'delete', path: memberPath})
			}
		}
	}
	else if (Array.isArray(before) && Array.isArray(after)) {
		collectArray(before, after, path, patch, options)
	}
	else {
		replaceValue(after, path, patch)
	}
}

/** Replace one changed value without descending further. */
function replaceValue(after: any, path: JSONPatchPath, patch: JSONPatch) {
	if (after !== undefined) {
		patch.push({type: 'set', path, after: clone(after)})
	}
	else {
		patch.push({type: 'delete', path})
	}
}

/** Match typed primitive values and typed IDs; use indexes for other records. */
function collectArray(before: any[], after: any[], path: JSONPatchPath, patch: JSONPatch, options: JSONPatchCompareOptions) {
	let previous = selectors(before, options.identity)
	let current = selectors(after, options.identity)
	let previousByKey = new Map(previous.map((member, index) => [memberKey(member), index]))
	let currentByKey = new Map(current.map((member, index) => [memberKey(member), index]))
	let keys = new Set([...previousByKey.keys(), ...currentByKey.keys()])

	for (let key of keys) {
		let beforeIndex = previousByKey.get(key)
		let afterIndex = currentByKey.get(key)
		let member = afterIndex === undefined ? previous[beforeIndex!] : current[afterIndex]
		let memberPath = [...path, member]

		if (beforeIndex !== undefined && afterIndex !== undefined) {
			collect(before[beforeIndex], after[afterIndex], memberPath, patch, options)
		}
		else if (afterIndex !== undefined) {
			patch.push({type: 'set', path: memberPath, after: clone(after[afterIndex])})
		}
		else {
			patch.push({type: 'delete', path: memberPath})
		}
	}

	if (!sameValue(previous, current)) {
		patch.push({type: 'order', path, after: clone(current)})
	}
}
