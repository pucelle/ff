import {PairKeysListMap, PairKeysMap, PairKeysSetMap, ListMap, SetMap, TwoWayListMap, TwoWayMap, TwoWaySetMap} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test Map Structs', () => {
	
	it('ListMap', () => {
		let m = new ListMap<string, string>()
		
		m.add('a', 'b')
		m.addIf('a', 'b')
		m.addIf('a', 'c')
		expect(m.countOf('a')).toEqual(2)
		expect([...m.entries()]).toEqual([['a', ['b', 'c']]])
		expect([...m.flatEntries()]).toEqual([['a', 'b'], ['a', 'c']])
		expect(m.get('a')).toEqual(['b', 'c'])
		expect(m.has('a', 'b')).toEqual(true)
		expect(m.hasKey('a')).toEqual(true)
		expect(m.keyCount()).toEqual(1)
		expect([...m.keys()]).toEqual(['a'])
		expect([...m.values()]).toEqual(['b', 'c'])
		expect([...m.valueLists()]).toEqual([['b', 'c']])

		m.set('a', ['d'])
		expect(m.get('a')).toEqual(['d'])

		m.delete('a', 'd')
		expect(m.hasKey('a')).toEqual(false)

		m.clear()
		m.addSeveral('a', ['b', 'c'])
		expect([...m.entries()]).toEqual([['a', ['b', 'c']]])
		m.deleteSeveral('a', ['b', 'c'])
		expect(m.hasKey('a')).toEqual(false)

		m.clear()
		m.addSeveralIf('a', ['b', 'b', 'c'])
		expect([...m.entries()]).toEqual([['a', ['b', 'c']]])
	})

	it('SetMap', () => {
		let m = new SetMap<string, string>()
		
		m.add('a', 'b')
		m.add('a', 'c')
		expect(m.countOf('a')).toEqual(2)
		expect([...m.entries()]).toEqual([['a', new Set(['b', 'c'])]])
		expect([...m.flatEntries()]).toEqual([['a', 'b'], ['a', 'c']])
		expect(m.get('a')).toEqual(new Set(['b', 'c']))
		expect(m.has('a', 'b')).toEqual(true)
		expect(m.hasKey('a')).toEqual(true)
		expect(m.keyCount()).toEqual(1)
		expect([...m.keys()]).toEqual(['a'])
		expect([...m.values()]).toEqual(['b', 'c'])
		expect([...m.valueLists()]).toEqual([new Set(['b', 'c'])])

		m.set('a', new Set('d'))
		expect([...m.get('a')!]).toEqual(['d'])

		m.delete('a', 'd')
		expect(m.hasKey('a')).toEqual(false)

		m.clear()
		m.addSeveral('a', ['b', 'c'])
		expect([...m.entries()]).toEqual([['a', new Set(['b', 'c'])]])
		m.deleteSeveral('a', ['b', 'c'])
		expect(m.hasKey('a')).toEqual(false)
	})

	it('TwoWayMap', () => {
		let m = new TwoWayMap<string, string>()
		
		m.set('a', 'b')

		expect(m.leftKeyCount()).toEqual(1)
		expect(m.rightKeyCount()).toEqual(1)
		expect([...m.entries()]).toEqual([['a', 'b']])
		expect(m.getByLeft('a')).toEqual('b')
		expect(m.getByRight('b')).toEqual('a')
		expect(m.hasLeft('a')).toEqual(true)
		expect(m.hasRight('b')).toEqual(true)
		expect([...m.leftKeys()]).toEqual(['a'])
		expect([...m.rightKeys()]).toEqual(['b'])

		m.deleteLeft('a')
		expect(m.hasLeft('a')).toEqual(false)
		expect(m.hasRight('b')).toEqual(false)

		m.clear()
		m.set('a', 'b')
		m.deleteRight('b')
		expect(m.hasLeft('a')).toEqual(false)
		expect(m.hasRight('b')).toEqual(false)

		m.clear()
		m.set('a', 'b')
		m.set('a', 'c')
		expect(m.hasLeft('a')).toEqual(true)
		expect(m.hasRight('b')).toEqual(true)
		expect(m.hasRight('c')).toEqual(true)

		m.clear()
		m.set('a', 'b')
		m.setUnRepeatably('a', 'c')
		expect(m.hasLeft('a')).toEqual(true)
		expect(m.hasRight('b')).toEqual(false)
		expect(m.hasRight('c')).toEqual(true)
	})

	it('TwoWayListMap', () => {
		let m = new TwoWayListMap<string, string>()
		
		m.add('a', 'b')
		m.addIf('a', 'b')
		m.addIf('a', 'c')
		expect(m.countOfLeft('a')).toEqual(2)
		expect(m.countOfRight('b')).toEqual(1)
		expect([...m.leftEntries()]).toEqual([['a', ['b', 'c']]])
		expect([...m.rightEntries()]).toEqual([['b', ['a']], ['c', ['a']]])
		expect([...m.flatEntries()]).toEqual([['a', 'b'], ['a', 'c']])
		expect(m.getByLeft('a')).toEqual(['b', 'c'])
		expect(m.getByRight('b')).toEqual(['a'])
		expect(m.has('a', 'b')).toEqual(true)
		expect(m.hasLeft('a')).toEqual(true)
		expect(m.hasRight('b')).toEqual(true)
		expect(m.leftKeyCount()).toEqual(1)
		expect(m.rightKeyCount()).toEqual(2)
		expect([...m.leftKeys()]).toEqual(['a'])
		expect([...m.rightKeys()]).toEqual(['b', 'c'])
		expect([...m.rightValuesOf('a')]).toEqual(['b', 'c'])
		expect([...m.leftValuesOf('b')]).toEqual(['a'])

		m.replaceLeft('a', ['d'])
		expect(m.getByLeft('a')).toEqual(['d'])
		expect(m.getByRight('d')).toEqual(['a'])

		m.delete('a', 'd')
		expect(m.hasLeft('a')).toEqual(false)

		m.add('a', 'b')
		m.deleteLeft('a')
		expect(m.hasLeft('a')).toEqual(false)
		expect(m.hasRight('b')).toEqual(false)

		m.add('a', 'b')
		m.deleteRight('b')
		expect(m.hasLeft('a')).toEqual(false)
		expect(m.hasRight('b')).toEqual(false)
	})

	it('TwoWaySetMap', () => {
		let m = new TwoWaySetMap<string, string>()
		
		m.add('a', 'b')
		m.add('a', 'c')
		expect(m.countOfLeft('a')).toEqual(2)
		expect(m.countOfRight('b')).toEqual(1)
		expect([...m.leftEntries()]).toEqual([['a', new Set(['b', 'c'])]])
		expect([...m.rightEntries()]).toEqual([['b', new Set(['a'])], ['c', new Set(['a'])]])
		expect([...m.flatEntries()]).toEqual([['a', 'b'], ['a', 'c']])
		expect(m.getByLeft('a')).toEqual(new Set(['b', 'c']))
		expect(m.getByRight('b')).toEqual(new Set(['a']))
		expect(m.has('a', 'b')).toEqual(true)
		expect(m.hasLeft('a')).toEqual(true)
		expect(m.hasRight('b')).toEqual(true)
		expect(m.leftKeyCount()).toEqual(1)
		expect(m.rightKeyCount()).toEqual(2)
		expect([...m.leftKeys()]).toEqual(['a'])
		expect([...m.rightKeys()]).toEqual(['b', 'c'])
		expect([...m.rightValuesOf('a')]).toEqual(['b', 'c'])
		expect([...m.leftValuesOf('b')]).toEqual(['a'])

		m.replaceLeft('a', new Set(['d']))
		expect(m.getByLeft('a')).toEqual(new Set(['d']))
		expect(m.getByRight('d')).toEqual(new Set(['a']))

		m.delete('a', 'd')
		expect(m.hasLeft('a')).toEqual(false)

		m.add('a', 'b')
		m.deleteLeft('a')
		expect(m.hasLeft('a')).toEqual(false)
		expect(m.hasRight('b')).toEqual(false)

		m.add('a', 'b')
		m.deleteRight('b')
		expect(m.hasLeft('a')).toEqual(false)
		expect(m.hasRight('b')).toEqual(false)
	})

	it('PairKeysMap', () => {
		let m = new PairKeysMap<string, string, string>()

		m.set('a', 'b', 'c')

		expect(m.firstKeyCount()).toEqual(1)
		expect(m.secondKeyCountOf('a')).toEqual(1)
		expect([...m.entries()]).toEqual([['a', new Map([['b', 'c']])]])
		expect([...m.flatEntries()]).toEqual([['a', 'b', 'c']])
		expect([...m.secondEntriesOf('a')]).toEqual([['b', 'c']])
		expect(m.get('a', 'b')).toEqual('c')
		expect(m.has('a', 'b')).toEqual(true)
		expect(m.hasFirstKey('a')).toEqual(true)
		expect([...m.firstKeys()]).toEqual(['a'])
		expect([...m.secondKeysOf('a')]).toEqual(['b'])
		expect([...m.values()]).toEqual(['c'])
		expect([...m.secondValuesOf('a')]).toEqual(['c'])

		m.set('a', 'b', 'd')
		expect(m.get('a', 'b')).toEqual('d')

		m.delete('a', 'b')
		expect(m.has('a', 'b')).toEqual(false)

		m.set('a', 'b', 'c')
		m.deleteOf('a')
		expect(m.hasFirstKey('a')).toEqual(false)
	})

	it('PairKeysListMap', () => {
		let m = new PairKeysListMap<string, string, string>()

		m.add('a', 'b', 'c')
		m.addIf('a', 'b', 'c')
		m.add('a', 'b', 'd')

		expect(m.countOf('a', 'b')).toEqual(2)
		expect(m.secondKeyCountOf('a')).toEqual(1)
		expect([...m.entries()]).toEqual([['a', 'b', ['c', 'd']]])
		expect([...m.flatEntries()]).toEqual([['a', 'b', 'c'], ['a', 'b', 'd']])
		expect([...m.secondEntriesOf('a')]).toEqual([['b', ['c', 'd']]])
		expect([...m.secondFlatEntriesOf('a')]).toEqual([['b', 'c'], ['b', 'd']])
		expect(m.get('a', 'b')).toEqual(['c', 'd'])
		expect(m.has('a', 'b', 'c')).toEqual(true)
		expect(m.hasKeys('a', 'b')).toEqual(true)
		expect(m.hasFirstKey('a')).toEqual(true)
		expect([...m.firstKeys()]).toEqual(['a'])
		expect([...m.secondKeysOf('a')]).toEqual(['b'])
		expect([...m.values('a', 'b')]).toEqual(['c', 'd'])
		expect([...m.secondValuesOf('a')]).toEqual(['c', 'd'])

		m.delete('a', 'b', 'c')
		expect(m.has('a', 'b', 'c')).toEqual(false)

		m.deleteKeys('a', 'b')
		expect(m.hasKeys('a', 'b')).toEqual(false)

		m.add('a', 'b', 'c')
		m.deleteFirstKey('a')
		expect(m.hasFirstKey('a')).toEqual(false)
	})

	it('PairKeysSetMap', () => {
		let m = new PairKeysSetMap<string, string, string>()

		m.add('a', 'b', 'c')
		m.add('a', 'b', 'd')

		expect(m.countOf('a', 'b')).toEqual(2)
		expect(m.secondKeyCountOf('a')).toEqual(1)
		expect([...m.entries()]).toEqual([['a', 'b', new Set(['c', 'd'])]])
		expect([...m.flatEntries()]).toEqual([['a', 'b', 'c'], ['a', 'b', 'd']])
		expect([...m.secondEntriesOf('a')]).toEqual([['b', new Set(['c', 'd'])]])
		expect([...m.secondFlatEntriesOf('a')]).toEqual([['b', 'c'], ['b', 'd']])
		expect(m.get('a', 'b')).toEqual(new Set(['c', 'd']))
		expect(m.has('a', 'b', 'c')).toEqual(true)
		expect(m.hasKeys('a', 'b')).toEqual(true)
		expect(m.hasFirstKey('a')).toEqual(true)
		expect([...m.firstKeys()]).toEqual(['a'])
		expect([...m.secondKeysOf('a')]).toEqual(['b'])
		expect([...m.values('a', 'b')]).toEqual(['c', 'd'])
		expect([...m.secondValuesOf('a')]).toEqual(['c', 'd'])

		m.delete('a', 'b', 'c')
		expect(m.has('a', 'b', 'c')).toEqual(false)

		m.deleteKeys('a', 'b')
		expect(m.hasKeys('a', 'b')).toEqual(false)

		m.add('a', 'b', 'c')
		m.deleteFirstKey('a')
		expect(m.hasFirstKey('a')).toEqual(false)
	})
})