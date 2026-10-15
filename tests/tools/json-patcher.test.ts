import {describe, expect, it, vi} from 'vitest'
import {JSONPatcher} from '../../src/tools/json/json-patcher'
import {applyJSONPatch} from '../../src/tools/json/json-patch-applier'


describe('JSONPatcher', () => {
	it('forwards static subtraction and application to the standalone APIs', () => {
		let data = {value: 1}
		let patch = new JSONPatcher().set(['value'], 2).toPatch()
		let result = JSONPatcher.apply(data, patch)
		let later = new JSONPatcher().set(['value'], 3).toPatch()

		expect(result.data).toEqual({value: 2})
		expect(JSONPatcher.subtract(result.undo, later)).toEqual([])
		expect(JSONPatcher.apply(result.data, result.undo).data).toEqual({value: 1})
	})

	it('treats missing and undefined fields alike while returning undo patches', () => {
		let before = {kept: undefined, removed: 1, nested: {value: 2}}
		let after = {kept: undefined, added: undefined, nested: {value: 3}}
		let patch = JSONPatcher.compare(before, after)
		let {data: result, undo} = applyJSONPatch(structuredClone(before), patch)

		expect(result).toEqual({kept: undefined, nested: {value: 3}})
		expect(Object.hasOwn(result, 'added')).toBe(false)
		expect(Object.hasOwn(result, 'removed')).toBe(false)
		expect(JSONPatcher.compare(result, after)).toEqual([])
		expect(applyJSONPatch(result, undo).data).toEqual(before)
	})

	it('does not patch between missing and undefined values', () => {
		expect(JSONPatcher.compare({}, {value: undefined})).toEqual([])
		expect(JSONPatcher.compare({value: undefined}, {})).toEqual([])
		expect(JSONPatcher.compare({nested: {value: undefined}}, {nested: {}})).toEqual([])
		expect(JSONPatcher.compare([], [undefined])).toEqual([])
		expect(JSONPatcher.compare([undefined, 1], [1])).toEqual([])
		expect(applyJSONPatch({value: 1}, []).undo).toEqual([])
	})

	it('detects deeper differences but replaces at maxDepth', () => {
		let before = {profile: {settings: {theme: 'dark'}, name: 'old'}, unchanged: {value: 1}}
		let after = {profile: {settings: {theme: 'light'}, name: 'new'}, unchanged: {value: 1}}
		let root = JSONPatcher.compare(before, after, {maxDepth: 0})
		let parent = JSONPatcher.compare(before, after, {maxDepth: 1})
		let child = JSONPatcher.compare(before, after, {maxDepth: 2})

		expect(root).toEqual([{type: 'set', path: [], after}])
		expect(parent).toEqual([{type: 'set', path: ['profile'], after: after.profile}])
		expect(child).toEqual([
			{type: 'set', path: ['profile', 'settings'], after: after.profile.settings},
			{type: 'set', path: ['profile', 'name'], after: 'new'},
		])

		for (let patch of [root, parent, child]) {
			expect(applyJSONPatch(structuredClone(before), patch).data).toEqual(after)
		}

		expect(JSONPatcher.compare(before, structuredClone(before), {maxDepth: 1})).toEqual([])
	})

	it('counts an identified array member as one comparison level', () => {
		let before = [{id: 1, details: {score: 1}}]
		let after = [{id: 1, details: {score: 2}}]
		let patch = JSONPatcher.compare(before, after, {maxDepth: 1})

		expect(patch).toEqual([{
			type: 'set', path: [{id: 1}], after: after[0],
		}])
		expect(applyJSONPatch(structuredClone(before), patch).data).toEqual(after)
	})

	it('rejects invalid maximum comparison depths', () => {
		expect(() => JSONPatcher.compare({}, {}, {maxDepth: -1})).toThrow(RangeError)
		expect(() => JSONPatcher.compare({}, {}, {maxDepth: 1.5})).toThrow(RangeError)
	})

	it('matches mixed array members by typed primitive value and object ID', () => {
		let before = [
			1, '1', false,
			{id: 1, name: 'old'},
			{id: '1', name: 'string'},
		]
		let after = [
			{id: '1', name: 'string'},
			1, false,
			{id: 1, name: 'new'},
			'2',
		]
		let patch = JSONPatcher.compare(before, after)
		let {data: result, undo} = applyJSONPatch(structuredClone(before), patch)

		expect(result).toEqual(after)
		expect(applyJSONPatch(result, undo).data).toEqual(before)
	})

	it('uses each object ID directly without an occurrence selector', () => {
		let before = [{id: 1, value: 'old'}, {id: '1', value: 'other'}]
		let after = [{id: '1', value: 'other'}, {id: 1, value: 'new'}]
		let patch = JSONPatcher.compare(before, after)
		let valueChange = patch.find(change => change.type === 'set')

		expect(valueChange?.path[0]).toEqual({id: 1})
		expect(applyJSONPatch(structuredClone(before), patch).data).toEqual(after)
	})

	it('rejects duplicate object IDs instead of assigning occurrences', () => {
		expect(() => JSONPatcher.compare([{id: 1}, {id: 1}], [{id: 1}]))
			.toThrow('Duplicate array member ID')

		let data = [{id: 1}]
		let patch = new JSONPatcher().insert([], {id: 1}).toPatch()
		expect(() => applyJSONPatch(data, patch)).toThrow('Duplicate array member ID')
		expect(data).toEqual([{id: 1}])
	})

	it('preserves duplicate primitive occurrences and compares anonymous records by index', () => {
		let before = [1, 1, {name: 'first'}, {name: 'second'}]
		let after = [{name: 'changed'}, 1, {name: 'second'}, 1, 1]
		let patch = JSONPatcher.compare(before, after)

		expect(applyJSONPatch(structuredClone(before), patch).data).toEqual(after)
	})

	it('reorders identified and anonymous records together', () => {
		let before = [{id: 1, name: 'identified'}, {name: 'anonymous'}]
		let after = [{name: 'anonymous'}, {id: 1, name: 'identified'}]
		let patch = JSONPatcher.compare(before, after)

		let {data: result, undo} = applyJSONPatch(structuredClone(before), patch)
		expect(result).toEqual(after)
		expect(applyJSONPatch(result, undo).data).toEqual(before)
	})

	it('accepts a domain identity for records with equal IDs in different tables', () => {
		let identity = (item: Record<string, any>) => JSON.stringify([item.table, typeof item.id, item.id])
		let before = [{table: 'a', id: 1, value: 1}, {table: 'b', id: 1, value: 2}]
		let after = [{table: 'b', id: 1, value: 3}, {table: 'a', id: 1, value: 1}]
		let patch = JSONPatcher.compare(before, after, {identity})

		let {data, undo} = applyJSONPatch(structuredClone(before), patch, {identity})
		expect(data).toEqual(after)
		expect(applyJSONPatch(data, undo, {identity}).data).toEqual(before)
	})

	it('uses numeric head, tail, index, and member positions in builder operations', () => {
		let data = [1, 2]
		let patch = new JSONPatcher()
			.insert([], 0, 0)
			.insert([], 3, -1)
			.insert([], 1.5, {before: {value: 2}})
			.move([], {value: 1}, {after: {value: 2}})
			.insert([], 1.25, 2)
			.toPatch()

		let {undo} = applyJSONPatch(data, patch)
		expect(data).toEqual([0, 1.5, 1.25, 2, 1, 3])
		expect(applyJSONPatch(data, undo).data).toEqual([1, 2])
	})

	it('undoes manually inserted and moved members', () => {
		let data = [{id: 1}, {id: 2}]
		let patch = new JSONPatcher()
			.insert([], {id: 3}, 0)
			.move([], {id: 1}, -1)
			.toPatch()
		let {undo} = applyJSONPatch(data, patch)

		expect(data).toEqual([{id: 3}, {id: 2}, {id: 1}])
		expect(applyJSONPatch(data, undo).data).toEqual([{id: 1}, {id: 2}])
	})

	it('can target a newly inserted identified member in a later builder operation', () => {
		let data = [{id: 1}]
		let patch = new JSONPatcher()
			.insert([], {id: 2}, 0)
			.move([], {id: 2}, -1)
			.toPatch()

		applyJSONPatch(data, patch)
		expect(data).toEqual([{id: 1}, {id: 2}])
	})

	it('rejects invalid numeric positions before moving an array member', () => {
		let data = [1, 2]
		let patch = new JSONPatcher().move([], {value: 1}, -2).toPatch()

		expect(() => applyJSONPatch(data, patch)).toThrow(RangeError)
		expect(data).toEqual([1, 2])
	})

	it('inserts at the tail when position is omitted', () => {
		let data = [1]
		let patch = new JSONPatcher().insert([], 2).toPatch()

		expect(patch[0]).toMatchObject({type: 'insert', position: -1})
		expect(applyJSONPatch(data, patch).data).toEqual([1, 2])
	})

	it('clones patch values and reports changes through a caller callback', () => {
		let next = {deep: {value: 2}}
		let patch = new JSONPatcher().set(['item'], next).toPatch()
		let onChange = vi.fn()
		next.deep.value = 3

		let {data, undo} = applyJSONPatch({}, patch, {onChange})
		expect(data).toEqual({item: {deep: {value: 2}}})
		expect(onChange).toHaveBeenCalledWith(data, 'item')
		expect(applyJSONPatch(data, undo).data).toEqual({})
	})

	it('builds replacements and deletions without previous values', () => {
		let before = {replace: 1, remove: 3}
		let patch = new JSONPatcher()
			.replace(['replace'], 2)
			.delete(['remove'])
			.toPatch()
		let {data: after, undo} = applyJSONPatch(structuredClone(before), patch)

		expect(after).toEqual({replace: 2})
		expect(applyJSONPatch(after, undo).data).toEqual(before)
	})

	it('emits distinct set and delete operations', () => {
		let patch = JSONPatcher.compare({replace: 1, remove: 2}, {replace: 3, added: 4})

		expect(patch).toEqual([
			{type: 'set', path: ['replace'], after: 3},
			{type: 'delete', path: ['remove']},
			{type: 'set', path: ['added'], after: 4},
		])
	})

	it('omits prior values from manual patches when they are not supplied', () => {
		let patch = new JSONPatcher()
			.set(['added'], 2)
			.delete(['removed'])
			.replace(['changed'], 3)
			.reorder(['items'], [{id: 2}, {id: 1}])
			.toPatch()

		expect(patch).toEqual([
			{type: 'set', path: ['added'], after: 2},
			{type: 'delete', path: ['removed']},
			{type: 'set', path: ['changed'], after: 3},
			{type: 'order', path: ['items'], after: [{id: 2}, {id: 1}]},
		])

		let data = {removed: 1, changed: 1, items: [{id: 1}, {id: 2}]}
		expect(applyJSONPatch(data, patch).data).toEqual({
			added: 2, changed: 3, items: [{id: 2}, {id: 1}],
		})
	})

	it('undoes only the changes actually made to the current data', () => {
		let patch = new JSONPatcher()
			.set(['known'], 2)
			.delete(['missing'])
			.toPatch()
		let data = {known: 3, untouched: 4}
		let {undo} = applyJSONPatch(data, patch)

		expect(data).toEqual({known: 2, untouched: 4})
		expect(undo).toEqual([{type: 'set', path: ['known'], after: 3}])
		expect(applyJSONPatch(data, undo).data).toEqual({known: 3, untouched: 4})
	})

	it('uses undefined as deletion in manual value changes', () => {
		let data = {value: 1}
		let patch = new JSONPatcher().replace(['value'], undefined).toPatch()

		expect(patch).toEqual([{type: 'delete', path: ['value']}])
		let {undo} = applyJSONPatch(data, patch)
		expect(data).toEqual({})
		expect(applyJSONPatch(data, undo).data).toEqual({value: 1})
		expect(applyJSONPatch({value: 1}, new JSONPatcher().set(['value'], undefined).toPatch()).data).toEqual({})
		expect(new JSONPatcher().insert([], undefined).toPatch()).toEqual([])
	})

	it('returns a replacement root and restores missing ancestors from source', () => {
		let root = JSONPatcher.compare(1, {value: 2})
		let {data: rootResult, undo} = applyJSONPatch(1, root)
		expect(rootResult).toEqual({value: 2})
		expect(applyJSONPatch(rootResult, undo).data).toBe(1)

		let patch = JSONPatcher.compare({parent: {value: 1}}, {parent: {value: 2}})
		let {data, undo: sourceUndo} = applyJSONPatch({parent: null}, patch, {source: {parent: {value: 2}}})
		expect(data).toEqual({parent: {value: 2}})
		expect(applyJSONPatch(data, sourceUndo).data).toEqual({parent: null})
		expect(applyJSONPatch(null, patch, {source: {parent: {value: 2}}}).data).toEqual({parent: {value: 2}})
	})

	it('recovers a nested container by ID when the source array has a different order', () => {
		let before = [{id: 1, nested: {value: 1}}, {id: 2, nested: {value: 8}}]
		let after = [{id: 1, nested: {value: 2}}, {id: 2, nested: {value: 8}}]
		let source = [after[1], after[0]]
		let current = [{id: 1, nested: null}, {id: 2, nested: {value: 8}}]

		applyJSONPatch(current, JSONPatcher.compare(before, after), {source})
		expect(current).toEqual(after)
	})

	it('round-trips mixed array additions, removals, and moves', () => {
		let cases = [
			[],
			[1],
			[1, 1],
			[1, '1'],
			[{id: 1, value: 1}],
			[{id: 1, value: 2}, {id: 2, value: 1}],
			[{name: 'a'}],
			[{id: 1}, {name: 'a'}],
			[{name: 'a'}, {id: 1}],
			[false, {name: 'a'}, 1],
		]

		for (let before of cases) {
			for (let after of cases) {
				let patch = JSONPatcher.compare(before, after)
				let {data: result, undo} = applyJSONPatch(structuredClone(before), patch)
				expect(result).toEqual(after)
				expect(applyJSONPatch(result, undo).data).toEqual(before)
			}
		}
	})
})
