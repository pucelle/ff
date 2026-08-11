import {JSONSearcher} from '../../src'
import {describe, expect, it} from 'vitest'


describe('JSON searcher', () => {
	it('searches every occurrence with a non-global regexp and keeps falsy values', () => {
		let text = 'value = false; value = 0; value = {ok: true}'
		expect(JSONSearcher.searchListFromRegExp(text, /value\s*=/)).toEqual([false, 0, {ok: true}])
	})

	it('escapes special characters in variable names', () => {
		expect(JSONSearcher.searchVariable('config.value = {ok: true}', 'config.value')).toEqual({ok: true})
	})
})
