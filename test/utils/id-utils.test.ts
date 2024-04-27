import * as IDUtils from '../../src/utils/id-utils'


describe('Test IDUtils', () => {
	test('intUid', () => {
		expect(IDUtils.intUid() - IDUtils.intUid()).toEqual(-1)
	})

	test('shortUid', () => {
		expect(IDUtils.shortUid()).toMatch(/^[0-9a-z]{12}$/i)
	})

	test('guid', () => {
		expect(IDUtils.guid()).toMatch(/^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/i)
	})

	test('prefixedUid & isUidInPrefix', () => {
		expect(/a-\d+/.test(IDUtils.prefixedUid('a'))).toEqual(true)
		expect(IDUtils.isUidInPrefix(IDUtils.prefixedUid('a'), 'a')).toEqual(true)
	})
})