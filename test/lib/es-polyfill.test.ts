import '../../src'

describe('Test ES Polyfill', () => {
	test('RegExp.escape exists and can rightly escape RegExp symbols', () => {
		expect(RegExp.escape('-[]/{}()*+?.\\^$|')).toEqual('\\-\\[\\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\\\^\\$\\|')
	})
})