import * as ff from '../../src'


describe('Test string', () => {
	test('select', () => {
		expect(ff.select('123', /2/, '$$ $& $1')).toEqual('$ 2 ')
		expect(ff.select('123', /4/, '$0')).toEqual('')

		expect(ff.select('123', /2/, '$0')).toEqual('2')
		expect(ff.select('123', /(2)/, '$1')).toEqual('2')

		expect(ff.selectAll('1223', /2/g, '$0')).toEqual(['2', '2'])
		expect(ff.selectAll('1223', /(2)/g, '$1')).toEqual(['2', '2'])
		
		expect(ff.select('1223', /(2)/, '$<name>')).toEqual('')
		expect(ff.select('1223', /(?<name>2)/, '$<other_name>')).toEqual('')
		expect(ff.selectAll('1223', /(?<name>2)/g, '$<name>')).toEqual(['2', '2'])
	})

	test('subMatchAt', () => {
		expect(ff.subMatchAt('123', /4/, 0)).toEqual('')
		expect(ff.subMatchAt('123', /2/, 1)).toEqual('')

		expect(ff.subMatchAt('123', /2/, 0)).toEqual('2')
		expect(ff.subMatchAt('123', /(2)/, 1)).toEqual('2')

		expect(ff.subMatchesAt('1223', /4/g, 0)).toEqual([])
		expect(ff.subMatchesAt('1223', /2/g, 1)).toEqual(['', ''])
		expect(ff.subMatchesAt('1223', /2/g, 0)).toEqual(['2', '2'])
		expect(ff.subMatchesAt('1223', /(2)/g, 1)).toEqual(['2', '2'])
	})

	test('subMatches', () => {
		expect(ff.subMatches('123', /4/)).toEqual([])

		expect(ff.subMatches('123', /(2)/)).toEqual([['2']])
		expect(ff.subMatches('123', /2/, 0)).toEqual([['2']])
		expect(ff.subMatches('123', /(2)/, 1)).toEqual([['2']])

		expect(ff.subMatches('123', /4/g)).toEqual([])
		expect(ff.subMatches('1223', /2/g, 0)).toEqual([['2'], ['2']])
		expect(ff.subMatches('1223', /(2)/g, 1)).toEqual([['2'], ['2']])
	})

	test('format', () => {
		expect(ff.format('a{0}{1}d', ['b','c'])).toEqual('abcd')
		expect(ff.format('a{x}{y}d', {x:'b',y:'c'})).toEqual('abcd')
		expect(ff.format('a{x}{y}d', {x:'b'})).toEqual('ab{y}d')
	})

	test('other string methods', () => {
		expect(ff.before('123', '2')).toEqual('1')
		expect(ff.after('123', '2')).toEqual('3')

		expect(ff.before('123', '4')).toEqual('')
		expect(ff.after('123', '4')).toEqual('')

		expect(ff.before('123', '4', true)).toEqual('123')
		expect(ff.after('123', '4', true)).toEqual('123')

		expect(ff.beforeLast('12323', '2')).toEqual('123')
		expect(ff.beforeLast('123', '4')).toEqual('')
		expect(ff.beforeLast('123', '4', true)).toEqual('123')

		expect(ff.afterLast('12323', '2')).toEqual('3')
		expect(ff.afterLast('123', '4')).toEqual('')
		expect(ff.afterLast('123', '4', true)).toEqual('123')

		expect(ff.capitalize('abc')).toEqual('Abc')
		expect(ff.toCamerCase('ab-c')).toEqual('abC')
		expect(ff.toDashCase('abC')).toEqual('ab-c')
		expect(ff.toDashCase('AbC')).toEqual('ab-c')
		expect(ff.toDashCase('ABC')).toEqual('abc')
	})
})