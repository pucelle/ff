import * as IDUtils from '../../src/utils/id'


describe('Test date', () => {
	test('intUid', () => {
		expect(IDUtils.intUid() - IDUtils.intUid()).toEqual(-1)
	})

	test('prefixedUid', () => {
		expect(/a-\d+/.test(IDUtils.prefixedUid('a'))).toEqual(true)
		expect(IDUtils.isUidInPrefix(IDUtils.prefixedUid('a'), 'a')).toEqual(true)
	})
})