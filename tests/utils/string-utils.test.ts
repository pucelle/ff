import {StringUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test StringUtils', () => {
	
	it('format', () => {
		expect(StringUtils.format('a{0}{1}d', ['b','c'])).toEqual('abcd')
		expect(StringUtils.format('a{x}{y}d', {x:'b',y:'c'})).toEqual('abcd')
		expect(StringUtils.format('a{x}{y}d', {x:'b'})).toEqual('ab{y}d')
	})

	it('other string methods', () => {
		expect(StringUtils.toCapitalize('abc')).toEqual('Abc')

		expect(StringUtils.toCamelCase('ab_c')).toEqual('abC')
		expect(StringUtils.toCamelCase('ab-c')).toEqual('abC')
		expect(StringUtils.toCamelCase('ab c')).toEqual('abC')

		expect(StringUtils.toDashCase('abC')).toEqual('ab-c')
		expect(StringUtils.toDashCase('AbC')).toEqual('ab-c')
		expect(StringUtils.toDashCase('ABC')).toEqual('abc')
		expect(StringUtils.toDashCase('ab c')).toEqual('ab-c')
		expect(StringUtils.toDashCase('ab_c')).toEqual('ab-c')

		expect(StringUtils.toUnderscoreCase('AbC')).toEqual('ab_c')
	})
})