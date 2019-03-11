import * as ff from '../src'


describe('Test array', () => {
	let a = (i: any) => [i]

	test('add', () => {
		expect(ff.add([1,2,3], 4)).toEqual([1,2,3,4])
		expect(ff.add([1,2,3], 3)).toEqual([1,2,3])
	})

	test('remove', () => {
		expect(ff.remove([1,2,3], 4)).toEqual([])
		expect(ff.remove([1,2,3], 3)).toEqual([3])
	})

	test('removeWhere', () => {
		expect(ff.removeWhere([1,2,3], (v) => v === 3)).toEqual([3])
		expect(ff.removeWhere([1,2,3], (v) => v === 4)).toEqual([])
	})

	test('unique', () => {
		expect(ff.unique([1,2,3,3])).toEqual([1,2,3])
	})

	test('union', () => {
		expect(ff.union([1,2,3], [3,4])).toEqual([1,2,3,4])
		expect(ff.union([1,2,3], [3,4], [4,5])).toEqual([1,2,3,4,5])
	})

	test('intersect', () => {
		expect(ff.intersect([1,2,3], [3,4])).toEqual([3])
		expect(ff.intersect([1,2,3], [3,4], [3,4,5])).toEqual([3])
	})

	test('diff', () => {
		expect(ff.difference([1,2,3], [3,4])).toEqual([1,2])
		expect(ff.difference([1,2,3], [3,4], [2,5])).toEqual([1])
	})

	test('orderBy', () => {
		expect(ff.orderBy([3,2,1].map(a), 0)).toEqual([1,2,3].map(a))
		expect(ff.orderBy([3,2,1].map(a), [0, 1])).toEqual([1,2,3].map(a))
		expect(ff.orderBy([1,2,3].map(a), [0, -1])).toEqual([3,2,1].map(a))
		expect(ff.orderBy([1,2,3].map(a), [0, 'desc'])).toEqual([3,2,1].map(a))

		expect(ff.orderBy([4,3,2,1].map(a), x=>+x)).toEqual([1,2,3,4].map(a))
		expect(ff.orderBy([4,3,2,1].map(a), x=>-x)).toEqual([4,3,2,1].map(a))
		expect(ff.orderBy([4,3,2,1].map(a), [x=>-x, -1])).toEqual([1,2,3,4].map(a))
		
		expect(ff.orderBy([{a:2}, {a:1}], 'a')).toEqual([{a:1}, {a:2}])
		expect(ff.orderBy([{a:1, b:2}, {a:1, b:1}], ['a', 1], 'b')).toEqual([{a:1,b:1}, {a:1,b:2}])
		expect(ff.orderBy([{a:1, b:2}, {a:1, b:1}], ['a', 1], ['b', -1])).toEqual([{a:1,b:2}, {a:1,b:1}])

		expect(ff.orderBy([1, false, null, undefined].map(a), 0)).toEqual([null, undefined, false, 1].map(a))
	})

	test('ff.Order()', () => {
		expect(ff.orderBy([1,2,3].map(a), new ff.Order([0, -1]))).toEqual([3,2,1].map(a))
		expect(() => new ff.Order(<any>null)).toThrow()
		expect(() => new ff.Order(<any>[null])).toThrow()

		expect(new ff.Order(0).binaryInsert([].map(a), [0])).toEqual([0].map(a))
		expect(new ff.Order(0).binaryInsert([0].map(a), [1])).toEqual([0,1].map(a))
		expect(new ff.Order(0).binaryInsert([1,2,3].map(a), [0])).toEqual([0,1,2,3].map(a))
		expect(new ff.Order(0).binaryInsert([1,2,3].map(a), [4])).toEqual([1,2,3,4].map(a))
		expect(new ff.Order(0).binaryInsert([1,2,3].map(a), [2])).toEqual([1,2,2,3].map(a))
		expect(new ff.Order(0).binaryInsert([1,2,3].map(a), [2.5])).toEqual([1,2,2.5,3].map(a))

		expect(new ff.Order([0, -1]).binaryInsert([3,2,1].map(a), [0])).toEqual([3,2,1,0].map(a))
		expect(new ff.Order([0, -1]).binaryInsert([3,2,1].map(a), [4])).toEqual([4,3,2,1].map(a))
		expect(new ff.Order([0, -1]).binaryInsert([3,2,1].map(a), [2])).toEqual([3,2,2,1].map(a))
		expect(new ff.Order([0, -1]).binaryInsert([3,2,1].map(a), [2.5])).toEqual([3,2.5,2,1].map(a))

		expect(new ff.Order(x=>-x).binaryInsert([3,2,1].map(a), [0])).toEqual([3,2,1,0].map(a))
		expect(new ff.Order([x=>-x, -1]).binaryInsert([1,2,3].map(a), [0])).toEqual([0,1,2,3].map(a))

		expect(new ff.Order('a').binaryInsert([{a:1}, {a:2}], {a:3})).toEqual([{a:1}, {a:2}, {a:3}])
		expect(new ff.Order(['a', -1]).binaryInsert([{a:2}, {a:1}], {a:3})).toEqual([{a:3}, {a:2}, {a:1}])

		expect(new ff.Order((x:{a:number})=>x.a).binaryInsert([{a:1}, {a:2}], {a:3})).toEqual([{a:1}, {a:2}, {a:3}])
		expect(new ff.Order([(x:{a:number})=>x.a, -1]).binaryInsert([{a:2}, {a:1}], {a:3})).toEqual([{a:3}, {a:2}, {a:1}])

		expect(new ff.Order('a', 'b').binaryInsert([{a:1, b:2}, {a:2, b:1}, {a:3, b:1}], {a:2, b:2})).toEqual([{a:1, b:2}, {a:2, b:1}, {a:2, b:2}, {a:3, b:1}])
		expect(new ff.Order(['a', -1], ['b', -1]).binaryInsert([{a:3, b:1}, {a:2, b:1}, {a:1, b:1}], {a:2, b:2})).toEqual([{a:3, b:1}, {a:2, b:2}, {a:2, b:1}, {a:1, b:1}])

		expect(new ff.Order(0).binaryFindIndex([].map(a), [1])).toEqual(-1)
		expect(new ff.Order(0).binaryFindIndex([1].map(a), [1])).toEqual(0)
		expect(new ff.Order(0).binaryFindIndex([1,2,3].map(a), [1])).toEqual(0)
		expect(new ff.Order(0).binaryFindIndex([1,2,3].map(a), [3])).toEqual(2)
		expect(new ff.Order(0).binaryFindIndex([1,2,3].map(a), [0])).toEqual(-1)
		expect(new ff.Order(0).binaryFindIndex([1,2,3].map(a), [4])).toEqual(-1)
		expect(new ff.Order(0).binaryFindIndex([1,2,3].map(a), [2.5])).toEqual(-1)
	})

	test('indexBy', () => {
		expect(ff.indexBy([1,2,3], (v) => [String(v), v])).toEqual({1:1, 2:2, 3:3})
		expect(ff.indexBy([1,2,3], (v) => [String(v), v + v])).toEqual({1:2, 2:4, 3:6})
		expect(ff.indexBy([1,2,3], (v) => [String(v), true])).toEqual({1:true, 2:true, 3:true})
	})

	test('keyBy', () => {
		expect(ff.keyBy([1,2,3], (v) => v)).toEqual({1:1, 2:2, 3:3})
		expect(ff.keyBy([1,2,3].map(a), 0)).toEqual({1:[1], 2:[2], 3:[3]})
	})

	test('groupBy', () => {
		expect(ff.groupBy([{a:1}, {a:2}, {a:2}], 'a')).toEqual({1:[{a:1}], 2:[{a:2}, {a:2}]})
		expect(ff.groupBy([{a:1}, {a:2}, {a:2}], x => x.a)).toEqual({1:[{a:1}], 2:[{a:2}, {a:2}]})
		expect(ff.groupBy([0,1,2,3,4,5,6,7,8,9], x => x % 3)).toEqual({0:[0,3,6,9], 1:[1,4,7], 2:[2,5,8]})
	})

	test('aggregate', () => {
		expect(ff.aggregate([{a:1}, {a:2}, {a:2}], 'a', ff.count)).toEqual({1:1, 2:2})
		expect(ff.aggregate([{a:1}, {a:2}, {a:2}], x => x.a, ff.count)).toEqual({1:1, 2:2})
		expect(ff.aggregate([0,1,2,3,4,5,6,7,8,9], x => x % 3, ff.count)).toEqual({0:4, 1:3, 2:3})
		expect(ff.aggregate([0,1,2,3,4,5,6,7,8,9], x => x % 3, ff.sum)).toEqual({0:0+3+6+9, 1:1+4+7, 2:2+5+8})
		expect(ff.aggregate([0,1,2,3,4,5,6,7,8,9], x => x % 3, ff.avg)).toEqual({0:4.5, 1:4, 2:5})
		expect(ff.aggregate([0,1,2,3,4,5,6,7,8,9], x => x % 3, ff.max)).toEqual({0:9, 1:7, 2:8})
		expect(ff.aggregate([0,1,2,3,4,5,6,7,8,9], x => x % 3, ff.min)).toEqual({0:0, 1:1, 2:2})
		expect(ff.aggregate([], x => x % 3, ff.avg)).toEqual({})
		expect(ff.avg([])).toEqual(0)
	})
})