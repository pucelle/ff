import {WeakPairKeysListMap, WeakPairKeysMap, WeakPairKeysSetMap, WeakListMap, WeakSetMap, WeakTwoWayListMap, WeakTwoWayMap, WeakTwoWaySetMap, WeakerPairKeysMap} from '../../src'


describe('Test Weak Map Structs', () => {
	let a = {}
	let b = {}
	let c = {}
	let d = {}
	
	test('WeakListMap', () => {
		let m = new WeakListMap<object, string>()
		
		m.add(a, 'b')
		m.addIf(a, 'b')
		m.addIf(a, 'c')
		expect(m.countOf(a)).toEqual(2)
		expect(m.get(a)).toEqual(['b', 'c'])
		expect(m.has(a, 'b')).toEqual(true)
		expect(m.hasKey(a)).toEqual(true)

		m.set(a, ['d'])
		expect(m.get(a)).toEqual(['d'])

		m.delete(a, 'd')
		expect(m.hasKey(a)).toEqual(false)

		m.clear()
		m.addSeveral(a, ['b', 'c'])
		expect(m.get(a)).toEqual(['b', 'c'])
		m.deleteSeveral(a, ['b', 'c'])
		expect(m.hasKey(a)).toEqual(false)

		m.clear()
		m.addSeveralIf(a, ['b', 'b', 'c'])
		expect(m.get(a)).toEqual(['b', 'c'])
	})

	test('WeakSetMap', () => {
		let m = new WeakSetMap<object, string>()
		
		m.add(a, 'b')
		m.add(a, 'c')
		expect(m.countOf(a)).toEqual(2)
		expect(m.get(a)).toEqual(new Set(['b', 'c']))
		expect(m.has(a, 'b')).toEqual(true)
		expect(m.hasKey(a)).toEqual(true)

		m.set(a, new Set('d'))
		expect([...m.get(a)!]).toEqual(['d'])

		m.delete(a, 'd')
		expect(m.hasKey(a)).toEqual(false)

		m.clear()
		m.addSeveral(a, ['b', 'c'])
		expect(m.get(a)).toEqual(new Set(['b', 'c']))
		m.deleteSeveral(a, ['b', 'c'])
		expect(m.hasKey(a)).toEqual(false)
	})

	test('WeakTwoWayMap', () => {
		let m = new WeakTwoWayMap<object, object>()
		
		m.set(a, b)

		expect(m.getByLeft(a)).toEqual(b)
		expect(m.getByRight(b)).toEqual(a)
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

	test('WeakTwoWayListMap', () => {
		let m = new WeakTwoWayListMap<object, object>()
		
		m.add(a, b)
		m.addIf(a, b)
		m.addIf(a, c)
		expect(m.getByLeft(a)).toEqual([b, c])
		expect(m.getByRight(b)).toEqual([a])
		expect(m.has(a, b)).toEqual(true)
		expect(m.hasLeft(a)).toEqual(true)
		expect(m.hasRight(b)).toEqual(true)

		m.setLeft(a, [d])
		expect(m.getByLeft(a)).toEqual([d])
		expect(m.getByRight(d)).toEqual([a])

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

	test('WeakTwoWaySetMap', () => {
		let m = new WeakTwoWaySetMap<object, object>()
		
		m.add(a, b)
		m.add(a, c)

		expect(m.getByLeft(a)).toEqual(new Set([b, c]))
		expect(m.getByRight(b)).toEqual(new Set([a]))
		expect(m.has(a, b)).toEqual(true)
		expect(m.hasLeft(a)).toEqual(true)
		expect(m.hasRight(b)).toEqual(true)

		m.setLeft(a, new Set([d]))
		expect(m.getByLeft(a)).toEqual(new Set([d]))
		expect(m.getByRight(d)).toEqual(new Set([a]))

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

	test('WeakerPairKeysMap', () => {
		let m = new WeakerPairKeysMap<object, object, string>()

		m.set(a, b, 'c')

		expect(m.get(a, b)).toEqual('c')
		expect(m.has(a, b)).toEqual(true)
		expect(m.hasKey(a)).toEqual(true)

		m.set(a, b, 'd')
		expect(m.get(a, b)).toEqual('d')

		m.delete(a, b)
		expect(m.has(a, b)).toEqual(false)

		m.set(a, b, 'c')
		m.deleteOf(a)
		expect(m.hasKey(a)).toEqual(false)
	})

	test('WeakPairKeysMap', () => {
		let m = new WeakPairKeysMap<object, string, string>()

		m.set(a, 'b', 'c')

		expect(m.secondKeyCountOf(a)).toEqual(1)
		expect([...m.secondEntriesOf(a)]).toEqual([['b', 'c']])
		expect(m.get(a, 'b')).toEqual('c')
		expect(m.has(a, 'b')).toEqual(true)
		expect(m.hasKey(a)).toEqual(true)
		expect([...m.secondKeysOf(a)]).toEqual(['b'])
		expect([...m.secondValuesOf(a)]).toEqual(['c'])

		m.set(a, 'b', 'd')
		expect(m.get(a, 'b')).toEqual('d')

		m.delete(a, 'b')
		expect(m.has(a, 'b')).toEqual(false)

		m.set(a, 'b', 'c')
		m.deleteOf(a)
		expect(m.hasKey(a)).toEqual(false)
	})

	test('WeakPairKeysListMap', () => {
		let m = new WeakPairKeysListMap<object, string, string>()

		m.add(a, 'b', 'c')
		m.addIf(a, 'b', 'c')
		m.add(a, 'b', 'd')

		expect(m.countOf(a, 'b')).toEqual(2)
		expect(m.secondKeyCountOf(a)).toEqual(1)
		expect([...m.secondEntriesOf(a)]).toEqual([['b', ['c', 'd']]])
		expect([...m.secondFlatEntriesOf(a)]).toEqual([['b', 'c'], ['b', 'd']])
		expect(m.get(a, 'b')).toEqual(['c', 'd'])
		expect(m.has(a, 'b', 'c')).toEqual(true)
		expect(m.hasKeys(a, 'b')).toEqual(true)
		expect(m.hasKey(a)).toEqual(true)
		expect([...m.secondKeysOf(a)]).toEqual(['b'])
		expect([...m.values(a, 'b')]).toEqual(['c', 'd'])
		expect([...m.secondValuesOf(a)]).toEqual(['c', 'd'])

		m.delete(a, 'b', 'c')
		expect(m.has(a, 'b', 'c')).toEqual(false)

		m.deleteKeys(a, 'b')
		expect(m.hasKeys(a, 'b')).toEqual(false)

		m.add(a, 'b', 'c')
		m.deleteSecondOf(a)
		expect(m.hasKey(a)).toEqual(false)
	})

	test('WeakPairKeysSetMap', () => {
		let m = new WeakPairKeysSetMap<object, string, string>()

		m.add(a, 'b', 'c')
		m.add(a, 'b', 'd')

		expect(m.countOf(a, 'b')).toEqual(2)
		expect(m.secondKeyCountOf(a)).toEqual(1)
		expect([...m.secondEntriesOf(a)]).toEqual([['b', new Set(['c', 'd'])]])
		expect([...m.secondFlatEntriesOf(a)]).toEqual([['b', 'c'], ['b', 'd']])
		expect(m.get(a, 'b')).toEqual(new Set(['c', 'd']))
		expect(m.has(a, 'b', 'c')).toEqual(true)
		expect(m.hasKeys(a, 'b')).toEqual(true)
		expect(m.hasKey(a)).toEqual(true)
		expect([...m.secondKeysOf(a)]).toEqual(['b'])
		expect([...m.values(a, 'b')]).toEqual(['c', 'd'])
		expect([...m.secondValuesOf(a)]).toEqual(['c', 'd'])

		m.delete(a, 'b', 'c')
		expect(m.has(a, 'b', 'c')).toEqual(false)

		m.deleteKeys(a, 'b')
		expect(m.hasKeys(a, 'b')).toEqual(false)

		m.add(a, 'b', 'c')
		m.deleteSecondOf(a)
		expect(m.hasKey(a)).toEqual(false)
	})
})