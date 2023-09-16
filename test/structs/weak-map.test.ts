import {DoubleKeysWeakListMap, DoubleKeysWeakMap, DoubleKeysWeakSetMap, ListWeakMap, SetWeakMap, TwoWayListWeakMap, TwoWayWeakMap, TwoWaySetWeakMap, DoubleKeysBothWeakMap} from '../../src/structs/weak-map'


describe('Test Weak Map Structs', () => {
	let a = {}
	let b = {}
	let c = {}
	let d = {}
	
	test('ListWeakMap', () => {
		let m = new ListWeakMap<object, string>()
		
		m.add(a, 'b')
		m.addIf(a, 'b')
		m.addIf(a, 'c')
		expect(m.countOf(a)).toEqual(2)
		expect(m.get(a)).toEqual(['b', 'c'])
		expect(m.has(a, 'b')).toEqual(true)
		expect(m.hasOf(a)).toEqual(true)

		m.set(a, ['d'])
		expect(m.get(a)).toEqual(['d'])

		m.delete(a, 'd')
		expect(m.hasOf(a)).toEqual(false)
	})

	test('SetWeakMap', () => {
		let m = new SetWeakMap<object, string>()
		
		m.add(a, 'b')
		m.add(a, 'c')
		expect(m.countOf(a)).toEqual(2)
		expect(m.get(a)).toEqual(new Set(['b', 'c']))
		expect(m.has(a, 'b')).toEqual(true)
		expect(m.hasOf(a)).toEqual(true)

		m.set(a, new Set('d'))
		expect([...m.get(a)!]).toEqual(['d'])

		m.delete(a, 'd')
		expect(m.hasOf(a)).toEqual(false)
	})

	test('TwoWayWeakMap', () => {
		let m = new TwoWayWeakMap<object, object>()
		
		m.set(a, b)

		expect(m.getLeft(a)).toEqual(b)
		expect(m.getRight(b)).toEqual(a)
		expect(m.hasLeft(a)).toEqual(true)
		expect(m.hasRight(b)).toEqual(true)

		m.deleteLeft(a)
		expect(m.hasLeft(a)).toEqual(false)
		expect(m.hasRight(b)).toEqual(false)

		m.set(a, b)
		m.deleteRight(b)
		expect(m.hasLeft(a)).toEqual(false)
		expect(m.hasRight(b)).toEqual(false)
	})

	test('TwoWayListWeakMap', () => {
		let m = new TwoWayListWeakMap<object, object>()
		
		m.add(a, b)
		m.addIf(a, b)
		m.addIf(a, c)
		expect(m.getLeft(a)).toEqual([b, c])
		expect(m.getRight(b)).toEqual([a])
		expect(m.has(a, b)).toEqual(true)
		expect(m.hasLeft(a)).toEqual(true)
		expect(m.hasRight(b)).toEqual(true)

		m.replaceLeft(a, [d])
		expect(m.getLeft(a)).toEqual([d])
		expect(m.getRight(d)).toEqual([a])

		m.delete(a, d)
		expect(m.hasLeft(a)).toEqual(false)

		m.add(a, b)
		m.deleteLeft(a)
		expect(m.hasLeft(a)).toEqual(false)
		expect(m.hasRight(b)).toEqual(false)

		m.add(a, b)
		m.deleteRight(b)
		expect(m.hasLeft(a)).toEqual(false)
		expect(m.hasRight(b)).toEqual(false)
	})

	test('TwoWaySetWeakMap', () => {
		let m = new TwoWaySetWeakMap<object, object>()
		
		m.add(a, b)
		m.add(a, c)

		expect(m.getLeft(a)).toEqual(new Set([b, c]))
		expect(m.getRight(b)).toEqual(new Set([a]))
		expect(m.has(a, b)).toEqual(true)
		expect(m.hasLeft(a)).toEqual(true)
		expect(m.hasRight(b)).toEqual(true)

		m.replaceLeft(a, new Set([d]))
		expect(m.getLeft(a)).toEqual(new Set([d]))
		expect(m.getRight(d)).toEqual(new Set([a]))

		m.delete(a, d)
		expect(m.hasLeft(a)).toEqual(false)

		m.add(a, b)
		m.deleteLeft(a)
		expect(m.hasLeft(a)).toEqual(false)
		expect(m.hasRight(b)).toEqual(false)

		m.add(a, b)
		m.deleteRight(b)
		expect(m.hasLeft(a)).toEqual(false)
		expect(m.hasRight(b)).toEqual(false)
	})

	test('DoubleKeysBothWeakMap', () => {
		let m = new DoubleKeysBothWeakMap<object, object, string>()

		m.set(a, b, 'c')

		expect(m.get(a, b)).toEqual('c')
		expect(m.has(a, b)).toEqual(true)
		expect(m.hasSecondOf(a)).toEqual(true)

		m.set(a, b, 'd')
		expect(m.get(a, b)).toEqual('d')

		m.delete(a, b)
		expect(m.has(a, b)).toEqual(false)

		m.set(a, b, 'c')
		m.deleteOf(a)
		expect(m.hasSecondOf(a)).toEqual(false)
	})

	test('DoubleKeysWeakMap', () => {
		let m = new DoubleKeysWeakMap<object, string, string>()

		m.set(a, 'b', 'c')

		expect(m.secondCountOf(a)).toEqual(1)
		expect([...m.secondEntriesOf(a)]).toEqual([['b', 'c']])
		expect(m.get(a, 'b')).toEqual('c')
		expect(m.has(a, 'b')).toEqual(true)
		expect(m.hasSecondOf(a)).toEqual(true)
		expect([...m.secondKeysOf(a)]).toEqual(['b'])
		expect([...m.secondValuesOf(a)]).toEqual(['c'])

		m.set(a, 'b', 'd')
		expect(m.get(a, 'b')).toEqual('d')

		m.delete(a, 'b')
		expect(m.has(a, 'b')).toEqual(false)

		m.set(a, 'b', 'c')
		m.deleteOf(a)
		expect(m.hasSecondOf(a)).toEqual(false)
	})

	test('DoubleKeysWeakListMap', () => {
		let m = new DoubleKeysWeakListMap<object, string, string>()

		m.add(a, 'b', 'c')
		m.addIf(a, 'b', 'c')
		m.add(a, 'b', 'd')

		expect(m.countOf(a, 'b')).toEqual(2)
		expect(m.secondCountOf(a)).toEqual(1)
		expect([...m.secondEntriesOf(a)]).toEqual([['b', ['c', 'd']]])
		expect([...m.secondFlatEntriesOf(a)]).toEqual([['b', 'c'], ['b', 'd']])
		expect(m.get(a, 'b')).toEqual(['c', 'd'])
		expect(m.has(a, 'b', 'c')).toEqual(true)
		expect(m.hasKeys(a, 'b')).toEqual(true)
		expect(m.hasSecondOf(a)).toEqual(true)
		expect([...m.secondKeysOf(a)]).toEqual(['b'])
		expect([...m.values(a, 'b')]).toEqual(['c', 'd'])
		expect([...m.secondValuesOf(a)]).toEqual(['c', 'd'])

		m.delete(a, 'b', 'c')
		expect(m.has(a, 'b', 'c')).toEqual(false)

		m.deleteKeys(a, 'b')
		expect(m.hasKeys(a, 'b')).toEqual(false)

		m.add(a, 'b', 'c')
		m.deleteSecondOf(a)
		expect(m.hasSecondOf(a)).toEqual(false)
	})

	test('DoubleKeysWeakSetMap', () => {
		let m = new DoubleKeysWeakSetMap<object, string, string>()

		m.add(a, 'b', 'c')
		m.add(a, 'b', 'd')

		expect(m.countOf(a, 'b')).toEqual(2)
		expect(m.secondCountOf(a)).toEqual(1)
		expect([...m.secondEntriesOf(a)]).toEqual([['b', new Set(['c', 'd'])]])
		expect([...m.secondFlatEntriesOf(a)]).toEqual([['b', 'c'], ['b', 'd']])
		expect(m.get(a, 'b')).toEqual(new Set(['c', 'd']))
		expect(m.has(a, 'b', 'c')).toEqual(true)
		expect(m.hasKeys(a, 'b')).toEqual(true)
		expect(m.hasSecondOf(a)).toEqual(true)
		expect([...m.secondKeysOf(a)]).toEqual(['b'])
		expect([...m.values(a, 'b')]).toEqual(['c', 'd'])
		expect([...m.secondValuesOf(a)]).toEqual(['c', 'd'])

		m.delete(a, 'b', 'c')
		expect(m.has(a, 'b', 'c')).toEqual(false)

		m.deleteKeys(a, 'b')
		expect(m.hasKeys(a, 'b')).toEqual(false)

		m.add(a, 'b', 'c')
		m.deleteSecondOf(a)
		expect(m.hasSecondOf(a)).toEqual(false)
	})
})