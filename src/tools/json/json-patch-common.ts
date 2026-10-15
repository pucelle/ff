import {deepClone} from '../../utils/object-utils'


/** Values supported in a JSON array, including explicit undefined in local data. */
export type JSONPatchPrimitive = string | number | boolean | null | undefined

/** 
 * Locate an array member by typed value, typed ID, or original index.
 * 
 * `occurrence` is the zero-based count of an identical primitive value. Object IDs must be unique within an array.
 * For [1, 1, 2], the two 1s are addressed as {value: 1, occurrence: 0} and {value: 1, occurrence: 1}.
 */
export type JSONArrayMember =
	| {readonly value: JSONPatchPrimitive, readonly occurrence?: number}
	| {readonly id: string | number}
	| {readonly index: number}

/** A field name or a stable array member selector. */
export type JSONPatchPath = readonly (string | JSONArrayMember)[]

/** A nonnegative index positions an item; 0 is head and -1 is tail. */
export type JSONArrayPosition =
	| number
	| {readonly before: JSONArrayMember}
	| {readonly after: JSONArrayMember}

/** A set of changes to JSON-like data. */
export type JSONPatch = (
	| {type: 'set', path: JSONPatchPath, after: any}
	| {type: 'delete', path: JSONPatchPath}
	| {type: 'order', path: JSONPatchPath, after: JSONArrayMember[]}
	| {type: 'insert', path: JSONPatchPath, value: any, position: JSONArrayPosition}
	| {type: 'move', path: JSONPatchPath, member: JSONArrayMember, position: JSONArrayPosition}
)[]

/** The resulting data and patches that restore its previous state. */
export interface JSONPatchApplyResult<T> {
	/** The possibly replaced root value. */
	data: T

	/** Apply these patches to restore the state before this application. */
	undo: JSONPatch
}

/** Options for applying a patch. */
export interface JSONPatchApplyOptions {

	/** 
	 * Provide the complete ancestors when a destination lacks an edited container.
	 * E.g., a patch edits parent.value but the current data has parent: null,
	 * source: {parent: {value: 2}} lets apply restore parent and continue.
	 */
	source?: unknown

	/** Notify after changing an object or array. */
	onChange?: (target: object, key: string) => void

	/** 
	 * Use a custom way to identify the object items in an array.
	 * If not specified, use object id property.
	 */
	identity?: (item: Record<string, any>) => string | number | undefined
}

/** Collection matching policy for comparing object members. */
export interface JSONPatchCompareOptions {

	/**
	 * Detect changes at any depth. Emit replacement patches no deeper than this depth.
	 * The root is depth 0.
	 */
	maxDepth?: number

	/** 
	 * Use a custom way to identify the object items in an array.
	 * If not specified, use object id property.
	 */
	identity?: (item: Record<string, any>) => string | number | undefined
}


/** Clone a value owned by a patch. */
export function clone<T>(value: T): T {
	return deepClone(value, Infinity)
}

/** JSON records exclude arrays. */
export function isRecord(value: unknown): value is Record<string, any> {
	return !!value && typeof value === 'object' && !Array.isArray(value)
}

/** Equality checks key presence as well as values. */
export function sameValue(a: any, b: any): boolean {
	if (Object.is(a, b)) {
		return true
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		let valuesA = a.filter(value => value !== undefined)
		let valuesB = b.filter(value => value !== undefined)

		return valuesA.length === valuesB.length
			&& valuesA.every((value, index) => sameValue(value, valuesB[index]))
	}
	else if (isRecord(a) && isRecord(b)) {
		let keysA = Object.keys(a).filter(key => a[key] !== undefined)
		let keysB = Object.keys(b).filter(key => b[key] !== undefined)

		return keysA.length === keysB.length
			&& keysA.every(key => b[key] !== undefined && sameValue(a[key], b[key]))
	}

	return false
}

/** Distinguish numeric and string IDs and repeated primitive values. */
export function selectors(
	items: any[],
	identity?: (item: Record<string, any>) => string | number | undefined
): JSONArrayMember[] {
	let occurrences = new Map<string, number>()
	let ids = new Set<string>()

	return items.map((item, index) => {
		let member: JSONArrayMember

		if (item === null || typeof item !== 'object') {
			member = {value: item}
		}
		else if (!Array.isArray(item)) {
			let id = identity ? identity(item) : item.id

			if (typeof id !== 'string' && typeof id !== 'number') {
				return {index}
			}

			member = {id}
			let key = memberKey(member)

			if (ids.has(key)) {
				throw new Error('Duplicate array member ID: ' + String(id))
			}

			ids.add(key)
			return member
		}
		else {
			return {index}
		}

		let key = memberKey(member)
		let occurrence = occurrences.get(key) ?? 0
		occurrences.set(key, occurrence + 1)
		return {...member, occurrence}
	})
}

/** Turn a selector into a stable patch-local token. */
export function memberKey(member: JSONArrayMember): string {
	if ('index' in member) {
		return JSON.stringify(['index', member.index])
	}
	else if ('id' in member) {
		return JSON.stringify(['id', typeof member.id, member.id])
	}
	else {
		return JSON.stringify(['value', typeof member.value, member.value, member.occurrence ?? 0])
	}
}


/** Container kind changes can require a complete ancestor from the source. */
export function sameContainer(a: unknown, b: unknown): boolean {
	return isRecord(a) && isRecord(b) || Array.isArray(a) && Array.isArray(b)
}
