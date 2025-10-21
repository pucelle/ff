import {IDUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test IDUtils', () => {
	it('intUid', () => {
		expect(IDUtils.intUid() - IDUtils.intUid()).toEqual(-1)
	})

	it('shortUid', () => {
		expect(IDUtils.shortUid()).toMatch(/^[0-9a-z]{12}$/i)
	})

	it('guid', () => {
		expect(IDUtils.guid()).toMatch(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i)
	})

	it('prefixedUid & isUidInPrefix', () => {
		expect(/a-\d+/.test(IDUtils.prefixedUid('a'))).toEqual(true)
		expect(IDUtils.isUidInPrefix(IDUtils.prefixedUid('a'), 'a')).toEqual(true)
	})
})