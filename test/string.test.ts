import * as ff from '../src'


describe('Test string', () => {
	test('select', () => {
		expect(ff.select('123', /2/, '$0')).toEqual('2')
		expect(ff.select('123', /(2)/, '$1')).toEqual('2')

		expect(ff.select('1223', /2/g, '$0')).toEqual(['2', '2'])
		expect(ff.select('1223', /(2)/g, '$1')).toEqual(['2', '2'])

		expect(ff.select('1223', /(?<name>2)/g, '$<name>')).toEqual(['2', '2'])
	})

	test('submatch', () => {
		expect(ff.submatch('123', /2/)).toEqual('2')
		expect(ff.submatch('123', /2/, 0)).toEqual('2')
		expect(ff.submatch('123', /(2)/, 1)).toEqual('2')

		expect(ff.submatch('1223', /2/g, 0)).toEqual(['2', '2'])
		expect(ff.submatch('1223', /(2)/g, 1)).toEqual(['2', '2'])
	})

	test('format', () => {
		expect(ff.format('a${0}${1}d', ['b','c'])).toEqual('abcd')
		expect(ff.format('a${x}${y}d', {x:'b',y:'c'})).toEqual('abcd')
		expect(ff.format('a${x}${y}d', {x:'b'})).toEqual('ab${y}d')
	})

	test('other string methods', () => {
		expect(ff.before('123', '2')).toEqual('1')
		expect(ff.after('123', '2')).toEqual('3')

		expect(ff.before('123', '4')).toEqual('')
		expect(ff.after('123', '4')).toEqual('')

		expect(ff.before('123', '4', true)).toEqual('123')
		expect(ff.after('123', '4', true)).toEqual('123')

		expect(ff.beforeLast('12323', '2')).toEqual('123')
		expect(ff.afterLast('12323', '2', true)).toEqual('3')

		expect(ff.capitalize('abc')).toEqual('Abc')
		expect(ff.toCamerCase('ab-c')).toEqual('abC')
		expect(ff.toLispCase('abC')).toEqual('ab-c')
		expect(ff.toLispCase('AbC')).toEqual('ab-c')
		expect(ff.toLispCase('ABC')).toEqual('abc')
	})
})