import {URLUtils} from '../../src'


describe('Test URLUtils', () => {
	
	test('parse & use query', () => {
		expect(URLUtils.parseQuery('abc.com?a=b&c=d')).toEqual({a:'b', c: 'd'})
		expect(URLUtils.useQuery('abc.com', {a:'b', c: 'd'})).toEqual('abc.com?a=b&c=d')
		expect(URLUtils.useQuery('abc.com?e=f', {a:'b', c: 'd'})).toEqual('abc.com?e=f&a=b&c=d')
	})
})