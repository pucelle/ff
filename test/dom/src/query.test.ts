import * as ff from '../../../src'
const assert = chai.assert


describe('Test query', () => {
	it('parseQuery', () => {
		assert.deepEqual(ff.parseQuery('http://www.example.com?a=b&c=d&e='), {
			a: 'b',
			c: 'd',
			e: ''
		})
	})

	it('useQuery', () => {
		assert.deepEqual(ff.useQuery('http://www.example.com', {a: 'b'}), 'http://www.example.com?a=b')
		assert.deepEqual(ff.useQuery('http://www.example.com?a=b', {c: 'd', e: ''}), 'http://www.example.com?a=b&c=d&e=')
	})
})
