import {compareJSONPatch} from './json-patch-comparer'
import {clone, isRecord, memberKey, sameContainer, selectors} from './json-patch-common'
import type {JSONPatch, JSONPatchApplyOptions, JSONPatchApplyResult, JSONPatchPath, JSONArrayMember, JSONArrayPosition} from './json-patch-common'
export type {JSONPatch, JSONPatchApplyOptions, JSONPatchApplyResult} from './json-patch-common'


/** State for selectors that must survive insertions and removals within one apply. */
interface ApplyState {
	tokens: WeakMap<any[], string[]>
	options: JSONPatchApplyOptions
}


/** Apply a patch in place and return the result with patches for undoing it. */
export function applyJSONPatch<T>(data: T, patch: JSONPatch, options: JSONPatchApplyOptions = {}): JSONPatchApplyResult<T> {
	if (patch.length === 0) {
		return {data, undo: []}
	}

	let previous = clone(data)

	if (options.source !== undefined && !sameContainer(data, options.source)) {
		data = clone(options.source) as T
	}
	else {
		let state: ApplyState = {tokens: new WeakMap(), options}

		for (let change of patch) {
			if (change.type === 'set' || change.type === 'delete') {
				data = applyValue(data, change, state)
			}
			else if (change.type === 'order') {
				applyOrder(data, change, state)
			}
			else {
				applyPositioned(data, change, state)
			}
		}
	}

	let undo = compareJSONPatch(data, previous, {identity: options.identity})
	return {data, undo}
}


/** Apply a root, object field, or array-member replacement. */
function applyValue<T>(
	data: T,
	change: Extract<JSONPatch[number], {type: 'set' | 'delete'}>,
	state: ApplyState
): T {
	let after = change.type === 'set' ? change.after : undefined

	if (change.path.length === 0) {
		return clone(after) as T
	}

	let parent = getAt(data, change.path.slice(0, -1), state)
	let key = change.path.at(-1)!

	if (Array.isArray(parent) && typeof key !== 'string') {
		applyArrayValue(parent, key, after, state)
	}
	else if (isRecord(parent) && typeof key === 'string') {
		if (after !== undefined) {
			parent[key] = clone(after)
		}
		else {
			delete parent[key]
		}

		state.options.onChange?.(parent, key)
	}

	return data
}

/** Add, replace, or remove a located array member. */
function applyArrayValue(
	target: any[],
	member: JSONArrayMember,
	after: any,
	state: ApplyState
) {
	let tokens = getTokens(target, state)
	let key = memberKey(member)
	let index = tokens.indexOf(key)

	if (after !== undefined) {
		let item = clone(after)

		if (index >= 0) {
			target[index] = item
		}
		else {
			target.push(item)
			tokens.push(key)
		}
	}
	else if (index >= 0) {
		target.splice(index, 1)
		tokens.splice(index, 1)
	}

	state.options.onChange?.(target, '')
}

/** Reorder known members while retaining extra members in the destination. */
function applyOrder(data: unknown, change: Extract<JSONPatch[number], {type: 'order'}>, state: ApplyState) {
	let target = getAt(data, change.path, state)

	if (!Array.isArray(target)) {
		return
	}

	let tokens = getTokens(target, state)
	let desired = change.after.map(memberKey)
	let itemByKey = new Map(tokens.map((key, index) => [key, target[index]]))
	let controlledKeys = desired.filter(key => itemByKey.has(key))
	let orderedKeys = [...controlledKeys, ...tokens.filter(key => !desired.includes(key))]

	target.splice(0, target.length, ...orderedKeys.map(key => itemByKey.get(key)))
	tokens.splice(0, tokens.length, ...orderedKeys)
	state.options.onChange?.(target, '')
}

/** Apply a manually requested insertion or move. */
function applyPositioned(
	data: unknown,
	change: Extract<JSONPatch[number], {type: 'insert' | 'move'}>,
	state: ApplyState
) {
	let target = getAt(data, change.path, state)

	if (!Array.isArray(target)) {
		return
	}

	let tokens = getTokens(target, state)
	validatePosition(change.position)

	let index = change.type === 'move' ? tokens.indexOf(memberKey(change.member)) : -1

	if (change.type === 'move' && index < 0) {
		return
	}

	let item = change.type === 'move'
		? target.splice(index, 1)[0]
		: clone(change.value)

	let key = change.type === 'move'
		? tokens.splice(index, 1)[0]
		: insertedToken(item, tokens, state.options.identity)

	let at = positionIndex(change.position, tokens)
	target.splice(at, 0, item)
	tokens.splice(at, 0, key)
	state.options.onChange?.(target, '')
}

/** Keep original index selectors stable across edits in one application. */
function getTokens(target: any[], state: ApplyState): string[] {
	let tokens = state.tokens.get(target)

	if (!tokens) {
		tokens = selectors(target, state.options.identity).map(memberKey)
		state.tokens.set(target, tokens)
	}

	return tokens
}

/** Locate a nested object or array member. */
function getAt(data: any, path: JSONPatchPath, state: ApplyState): any {
	let target = data
	let source: any = state.options.source

	for (let part of path) {
		if (typeof part === 'string') {
			if (!isRecord(target)) {
				return undefined
			}

			let value = target[part]
			let edited = source?.[part]

			if (!sameContainer(value, edited) && edited !== undefined) {
				target[part] = clone(edited)
				state.options.onChange?.(target, part)
			}

			target = target[part]
			source = edited
		}
		else {
			if (!Array.isArray(target)) {
				return undefined
			}

			let key = memberKey(part)
			let index = getTokens(target, state).indexOf(key)

			let sourceIndex = Array.isArray(source)
				? selectors(source, state.options.identity).findIndex(member => memberKey(member) === key)
				: -1

			target = target[index]
			source = sourceIndex >= 0 ? source[sourceIndex] : undefined
		}
	}

	return target
}


/** Resolve a builder-specified position against the current array. */
function positionIndex(position: JSONArrayPosition, tokens: string[]): number {
	if (typeof position === 'number') {
		return position === -1 ? tokens.length : Math.min(position, tokens.length)
	}
	else {
		let member = 'before' in position ? position.before : position.after
		let index = tokens.indexOf(memberKey(member))

		return index < 0 ? tokens.length : index + ('after' in position ? 1 : 0)
	}
}

/** Reject numeric positions that cannot identify one array boundary. */
function validatePosition(position: JSONArrayPosition) {
	if (typeof position === 'number' && (!Number.isInteger(position) || position < -1)) {
		throw new RangeError('Array position must be -1 or a nonnegative integer')
	}
}

/** Give manually inserted values a patch-local token. */
function nextToken(tokens: string[]): string {
	let index = 0

	while (tokens.includes('manual:' + index)) {
		index++
	}

	return 'manual:' + index
}

/** Make a new member addressable by value or ID in subsequent builder operations. */
function insertedToken(
	item: any,
	tokens: string[],
	identity?: (item: Record<string, any>) => string | number | undefined
): string {
	let member = selectors([item], identity)[0]

	if ('index' in member) {
		return nextToken(tokens)
	}
	else if ('id' in member) {
		let key = memberKey(member)

		if (tokens.includes(key)) {
			throw new Error('Duplicate array member ID: ' + String(member.id))
		}

		return key
	}

	let occurrence = 0
	let key: string

	while (tokens.includes(key = memberKey({...member, occurrence}))) {
		occurrence++
	}

	return key!
}
