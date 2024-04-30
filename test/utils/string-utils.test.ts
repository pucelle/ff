import {StringUtils} from '../../src'


describe('Test StringUtils', () => {
	
	test('format', () => {
		expect(StringUtils.format('a{0}{1}d', ['b','c'])).toEqual('abcd')
		expect(StringUtils.format('a{x}{y}d', {x:'b',y:'c'})).toEqual('abcd')
		expect(StringUtils.format('a{x}{y}d', {x:'b'})).toEqual('ab{y}d')
	})

	test('encode & decode html', () => {
		expect(StringUtils.encodeHTML('<abc>')).toEqual('&lt;abc&gt;')
		//expect(StringUtils.decodeHTML('&lt;abc&gt;')).toEqual('<abc>')
	})

	test('other string methods', () => {
		expect(StringUtils.toCapitalize('abc')).toEqual('Abc')

		expect(StringUtils.toCamerCase('ab_c')).toEqual('abC')
		expect(StringUtils.toCamerCase('ab-c')).toEqual('abC')
		expect(StringUtils.toCamerCase('ab c')).toEqual('abC')

		expect(StringUtils.toDashCase('abC')).toEqual('ab-c')
		expect(StringUtils.toDashCase('AbC')).toEqual('ab-c')
		expect(StringUtils.toDashCase('ABC')).toEqual('abc')
		expect(StringUtils.toDashCase('ab c')).toEqual('ab-c')
		expect(StringUtils.toDashCase('ab_c')).toEqual('ab-c')

		expect(StringUtils.toUnderscoreCase('AbC')).toEqual('ab_c')
	})
})