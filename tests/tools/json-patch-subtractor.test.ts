import {describe, expect, it} from 'vitest'
import {applyJSONPatch} from '../../src/tools/json/json-patch-applier'
import {compareJSONPatch} from '../../src/tools/json/json-patch-comparer'
import {subtractJSONPatch} from '../../src/tools/json/json-patch-subtractor'
import {JSONPatcher} from '../../src/tools/json/json-patcher'
import type {JSONPatch} from '../../src/tools/json/json-patch-common'


describe('subtractJSONPatch', () => {
	it('removes the first undo changes covered by a later patch', () => {
		let data = {first: 0, second: 0}
		let first = compareJSONPatch(data, {first: 1, second: 1})
		let firstUndo = applyJSONPatch(data, first).undo
		let later = new JSONPatcher().set(['first'], 2).toPatch()
		applyJSONPatch(data, later)

		let remaining = subtractJSONPatch(firstUndo, later)
		expect(remaining).toEqual([{type: 'set', path: ['second'], after: 0}])
		expect(applyJSONPatch(data, remaining).data).toEqual({first: 2, second: 0})
		expect(firstUndo).toHaveLength(2)
	})

	it('uses later write intent even when the value is unchanged', () => {
		let earlier: JSONPatch = [{type: 'set', path: ['value'], after: 0}]
		let later: JSONPatch = [{type: 'set', path: ['value'], after: 1}]

		expect(subtractJSONPatch(earlier, later)).toEqual([])
	})

	it('drops a broad replacement when a later nested value owns part of it', () => {
		let earlier: JSONPatch = [
			{type: 'set', path: ['profile'], after: {name: 'old', score: 0}},
			{type: 'set', path: ['other'], after: 0},
		]
		let later: JSONPatch = [{type: 'set', path: ['profile', 'name'], after: 'new'}]

		expect(subtractJSONPatch(earlier, later)).toEqual([earlier[1]])
	})

	it('keeps a later edited array member while removing another earlier member', () => {
		let data = {items: [] as {id: number, label: string}[]}
		let first = compareJSONPatch(data, {
			items: [{id: 1, label: 'first'}, {id: 2, label: 'second'}],
		})
		let firstUndo = applyJSONPatch(data, first).undo
		let later = new JSONPatcher().set(['items', {id: 1}, 'label'], 'later').toPatch()
		applyJSONPatch(data, later)

		let remaining = subtractJSONPatch(firstUndo, later)
		expect(applyJSONPatch(data, remaining).data).toEqual({
			items: [{id: 1, label: 'later'}],
		})
	})

	it('distinguishes typed IDs and protects unstable indexes after insertion', () => {
		let earlier: JSONPatch = [
			{type: 'set', path: ['items', {id: 1}, 'value'], after: 0},
			{type: 'set', path: ['items', {id: '1'}, 'value'], after: 0},
			{type: 'set', path: ['items', {index: 0}, 'value'], after: 0},
		]
		let later: JSONPatch = [
			{type: 'set', path: ['items', {id: '1'}, 'value'], after: 2},
			{type: 'insert', path: ['items'], value: {id: 3}, position: 0},
		]

		expect(subtractJSONPatch(earlier, later)).toEqual([earlier[0]])
	})

	it('uses the supplied identity policy for inserted members', () => {
		let earlier: JSONPatch = [{type: 'delete', path: ['items', {id: 'custom'}]}]
		let later: JSONPatch = [{
			type: 'insert', path: ['items'], value: {id: 1, key: 'custom'}, position: -1,
		}]

		expect(subtractJSONPatch(earlier, later, {identity: item => item.key})).toEqual([])
		expect(subtractJSONPatch(earlier, later, {identity: () => undefined})).toEqual(earlier)
	})

	it('removes an earlier array order when a later move changes that array', () => {
		let earlier: JSONPatch = [
			{type: 'order', path: ['items'], after: [{id: 1}, {id: 2}]},
			{type: 'set', path: ['other'], after: 0},
		]
		let later: JSONPatch = [{type: 'move', path: ['items'], member: {id: 2}, position: 0}]

		expect(subtractJSONPatch(earlier, later)).toEqual([earlier[1]])
	})
})
