import {URLUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test URLUtils', () => {
	
	it('parse query', () => {
		expect(URLUtils.parseQuery('abc.com?a=b&c=d')).toEqual({a:'b', c: 'd'})
	})

	it('use query', () => {
		expect(URLUtils.useQuery('abc.com', {a:'b', c: 'd'})).toEqual('abc.com?a=b&c=d')
		expect(URLUtils.useQuery('abc.com?e=f', {a:'b', c: 'd'})).toEqual('abc.com?e=f&a=b&c=d')
	})

	it('remove query', () => {
		expect(URLUtils.removeQuery('abc.com?e=f')).toEqual('abc.com')
	})
})