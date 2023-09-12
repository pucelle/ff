import '../../src/utils/polyfill'


describe('Test Polyfills', () => {
	test('RegExp.escape exists and can rightly escape RegExp symbols', () => {
		expect(RegExp.escape('-[]/{}()*+?.\\^$|')).toEqual('\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|')
	})
})