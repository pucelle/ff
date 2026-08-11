import {IDUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test IDUtils', () => {
	it('intUid', () => {
		expect(IDUtils.intUid() - IDUtils.intUid()).toEqual(-1)
	})

	it('randomHex', () => {
		let value = IDUtils.randomHex(6)
		expect(value).toBeInstanceOf(Uint8Array)
		expect(value).toHaveLength(6)
	})

	it('randomHexString', () => {
		expect(IDUtils.randomHexString(6)).toMatch(/^[0-9a-f]{12}$/)
	})

	it('prefixedUid & isUidInPrefix', () => {
		expect(/a-\d+/.test(IDUtils.prefixedUid('a'))).toEqual(true)
		expect(IDUtils.isUidInPrefix(IDUtils.prefixedUid('a'), 'a')).toEqual(true)
	})
})
