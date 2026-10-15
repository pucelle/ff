import {memberKey} from './json-patch-common'
import type {
	JSONArrayMember,
	JSONPatch,
	JSONPatchCompareOptions,
	JSONPatchPath,
} from './json-patch-common'


/**
 * Remove earlier changes that a later patch covers.
 * A partially covered whole-value change is removed because it cannot be split without data.
 */
export function subtractJSONPatch(
	earlier: JSONPatch,
	later: JSONPatch,
	options: JSONPatchCompareOptions = {}
): JSONPatch {
	return earlier.filter(change => !later.some(next => covers(change, next, options)))
}

/** Decide whether a later operation makes an earlier operation unsafe or redundant. */
function covers(
	earlier: JSONPatch[number],
	later: JSONPatch[number],
	options: JSONPatchCompareOptions
): boolean {
	if (later.type === 'set' || later.type === 'delete') {
		if (earlier.type === 'set' || earlier.type === 'delete') {
			return pathsOverlap(earlier.path, later.path)
				|| unstableMemberChanged(earlier.path, later.path)
		}
		else if (pathStartsWith(later.path, earlier.path)) {
			return true
		}
		else if (earlier.type === 'order') {
			return isDirectMemberPath(later.path, earlier.path)
		}
		else if (later.type === 'delete' && earlier.type === 'move') {
			return samePath(later.path, [...earlier.path, earlier.member])
		}
		else if (later.type === 'delete' && earlier.type === 'insert') {
			return insertedMemberMatches(earlier.value, later.path, earlier.path, options)
		}

		return false
	}

	if (earlier.type === 'set' || earlier.type === 'delete') {
		if (pathStartsWith(earlier.path, later.path)) {
			return true
		}
		else if (usesUnstableMember(earlier.path, later.path)) {
			return true
		}
		else if (earlier.type === 'delete' && later.type === 'move') {
			return samePath(earlier.path, [...later.path, later.member])
		}
		else if (earlier.type === 'delete' && later.type === 'order') {
			return orderedMemberMatches(earlier.path, later.path, later.after)
		}
		else if (later.type === 'insert') {
			return insertedMemberMatches(later.value, earlier.path, later.path, options)
		}

		return false
	}

	if (earlier.type === 'order' || earlier.type === 'move') {
		return samePath(earlier.path, later.path)
	}

	return false
}

/** Detect an array edit that can shift an earlier index or primitive occurrence. */
function unstableMemberChanged(earlier: JSONPatchPath, later: JSONPatchPath): boolean {
	return earlier.some((part, index) => {
		if (typeof part === 'string' || 'id' in part) {
			return false
		}

		let arrayPath = earlier.slice(0, index)
		return isDirectMemberPath(later, arrayPath)
	})
}

/** Detect a structural operation on an array addressed by an unstable selector. */
function usesUnstableMember(path: JSONPatchPath, arrayPath: JSONPatchPath): boolean {
	if (!pathStartsWith(arrayPath, path) || path.length <= arrayPath.length) {
		return false
	}

	let member = path[arrayPath.length]
	return typeof member !== 'string' && !('id' in member)
}

/** Keep a member that a later order explicitly includes. */
function orderedMemberMatches(
	path: JSONPatchPath,
	arrayPath: JSONPatchPath,
	ordered: JSONArrayMember[]
): boolean {
	if (!isDirectMemberPath(path, arrayPath)) {
		return false
	}

	let member = path.at(-1) as JSONArrayMember
	return ordered.some(each => memberKey(each) === memberKey(member))
}

/** Match a path to an inserted array member when its identity is available. */
function insertedMemberMatches(
	value: any,
	path: JSONPatchPath,
	arrayPath: JSONPatchPath,
	options: JSONPatchCompareOptions
): boolean {
	if (!pathStartsWith(arrayPath, path) || path.length <= arrayPath.length) {
		return false
	}

	let part = path[arrayPath.length]
	if (typeof part === 'string') {
		return false
	}

	if ('index' in part) {
		return true
	}
	else if ('id' in part) {
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return false
		}

		let id = options.identity ? options.identity(value) : value.id

		return (typeof id === 'string' || typeof id === 'number')
			&& memberKey(part) === memberKey({id})
	}
	else {
		return (value === null || typeof value !== 'object')
			&& Object.is(part.value, value)
	}
}

/** Identify a direct array member beneath the given array path. */
function isDirectMemberPath(path: JSONPatchPath, arrayPath: JSONPatchPath): boolean {
	return path.length === arrayPath.length + 1
		&& pathStartsWith(arrayPath, path)
		&& typeof path.at(-1) !== 'string'
}

/** Check whether two paths address intersecting values. */
function pathsOverlap(first: JSONPatchPath, second: JSONPatchPath): boolean {
	return pathStartsWith(first, second) || pathStartsWith(second, first)
}

/** Compare a whole path using typed array member selectors. */
function samePath(first: JSONPatchPath, second: JSONPatchPath): boolean {
	return first.length === second.length && pathStartsWith(first, second)
}

/** Compare the initial path segments using typed array member selectors. */
function pathStartsWith(prefix: JSONPatchPath, path: JSONPatchPath): boolean {
	return prefix.length <= path.length && prefix.every((part, index) => {
		let other = path[index]

		if (typeof part === 'string' || typeof other === 'string') {
			return part === other
		}

		return memberKey(part) === memberKey(other)
	})
}
