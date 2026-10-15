import {clone} from './json-patch-common'
import {applyJSONPatch} from './json-patch-applier'
import {compareJSONPatch} from './json-patch-comparer'
import {subtractJSONPatch} from './json-patch-subtractor'
import type {
	JSONPatch,
	JSONPatchApplyOptions,
	JSONPatchApplyResult,
	JSONPatchCompareOptions,
	JSONPatchPath,
	JSONArrayMember,
	JSONArrayPosition,
} from './json-patch-common'


/** Compare, construct, subtract, and apply patches to JSON-like data. */
export class JSONPatcher {

	/** Build a patch from two values. */
	static compare(before: unknown, after: unknown, options: JSONPatchCompareOptions = {}): JSONPatch {
		return compareJSONPatch(before, after, options)
	}

	/** Remove changes covered by a later patch. */
	static subtract(earlier: JSONPatch, later: JSONPatch, options: JSONPatchCompareOptions = {}): JSONPatch {
		return subtractJSONPatch(earlier, later, options)
	}

	/** Apply a patch and return the result with patches for undoing it. */
	static apply<T>(data: T, patch: JSONPatch, options: JSONPatchApplyOptions = {}): JSONPatchApplyResult<T> {
		return applyJSONPatch(data, patch, options)
	}

	/** Changes composed through the builder methods. */
	private changes: JSONPatch = []

	/** Record a replacement or deletion when can't do smaller modification. */
	replace(path: JSONPatchPath, value: any): this {
		if (value !== undefined) {
			this.set(path, value)
		}
		else {
			this.delete(path)
		}

		return this
	}

	/** Set a field or member. */
	set(path: JSONPatchPath, value: any): this {
		if (value !== undefined) {
			this.changes.push({
				type: 'set', path,
				after: clone(value),
			})
		}
		else {
			this.delete(path)
		}

		return this
	}

	/** Delete a field or member. */
	delete(path: JSONPatchPath): this {
		this.changes.push({
			type: 'delete',
			path,
		})

		return this
	}

	/** Insert an array value at a current member, index, or edge. */
	insert(path: JSONPatchPath, value: any, position: JSONArrayPosition = -1): this {
		if (value === undefined) {
			return this
		}

		this.changes.push({
			type: 'insert',
			path,
			value: clone(value),
			position,
		})
		return this
	}

	/** Move an existing array member relative to another member or edge. */
	move(path: JSONPatchPath, member: JSONArrayMember, position: JSONArrayPosition): this {
		this.changes.push({
			type: 'move',
			path,
			member,
			position,
		})

		return this
	}

	/** Record an array ordering change. */
	reorder(path: JSONPatchPath, after: JSONArrayMember[]): this {
		this.changes.push({
			type: 'order',
			path,
			after: clone(after),
		})

		return this
	}

	/** Return an independent patch snapshot. */
	toPatch(): JSONPatch {
		return [...this.changes]
	}
}
