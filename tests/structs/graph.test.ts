import {describe, expect, it} from 'vitest'
import {DAG} from '../../src/structs/graph'


describe('DAG traversal', () => {

	function createTree() {
		let dag = new DAG<string>()

		/*
		 *         A
		 *       /   \
		 *      B     C
		 *     / \   / \
		 *    D   E F   G
		 */
		dag.add('B', 'A')
		dag.add('C', 'A')

		dag.add('D', 'B')
		dag.add('E', 'B')

		dag.add('F', 'C')
		dag.add('G', 'C')

		return dag
	}

	it('walks downward using depth-first traversal', () => {
		let dag = createTree()

		expect([...dag.walkDownDepthFirst('A')]).toEqual([
			'A',
			'B',
			'D',
			'E',
			'C',
			'F',
			'G',
		])
	})

	it('walks downward using breadth-first traversal', () => {
		let dag = createTree()

		expect([...dag.walkDownBreadthFirst('A')]).toEqual([
			'A',
			'B',
			'C',
			'D',
			'E',
			'F',
			'G',
		])
	})

	it('walks upward using depth-first traversal', () => {
		let dag = createTree()

		expect([...dag.walkUpDepthFirst('D')]).toEqual([
			'D',
			'B',
			'A',
		])
	})

	it('walks upward using breadth-first traversal', () => {
		let dag = createTree()

		expect([...dag.walkUpBreadthFirst('D')]).toEqual([
			'D',
			'B',
			'A',
		])
	})

	it('walks upward through multiple parents using depth-first traversal', () => {
		let dag = new DAG<string>()

		/*
		 * A → B ─┐
		 *         ↓
		 * C → D → E
		 */
		dag.add('B', 'A')
		dag.add('E', 'B')

		dag.add('D', 'C')
		dag.add('E', 'D')

		expect([...dag.walkUpDepthFirst('E')]).toEqual([
			'E',
			'B',
			'A',
			'D',
			'C',
		])
	})

	it('walks upward through multiple parents using breadth-first traversal', () => {
		let dag = new DAG<string>()

		dag.add('B', 'A')
		dag.add('E', 'B')

		dag.add('D', 'C')
		dag.add('E', 'D')

		expect([...dag.walkUpBreadthFirst('E')]).toEqual([
			'E',
			'B',
			'D',
			'A',
			'C',
		])
	})

	it('visits a shared descendant only once', () => {
		let dag = new DAG<string>()

		/*
		 * A → B ─┐
		 * └→ C ──┴→ D
		 */
		dag.add('B', 'A')
		dag.add('C', 'A')
		dag.add('D', 'B')
		dag.add('D', 'C')

		let result = [...dag.walkDownBreadthFirst('A')]

		expect(result).toEqual([
			'A',
			'B',
			'C',
			'D',
		])

		expect(result.filter(id => id === 'D')).toHaveLength(1)
	})

	it('supports a direct connection to a descendant', () => {
		let dag = new DAG<string>()

		/*
		 * A → B → C
		 * └─────→ C
		 */
		dag.add('B', 'A')
		dag.add('C', 'B')
		dag.add('C', 'A')

		expect([...dag.walkDownDepthFirst('A')]).toEqual([
			'A',
			'B',
			'C',
		])

		expect([...dag.walkDownBreadthFirst('A')]).toEqual([
			'A',
			'B',
			'C',
		])

		expect([...dag.walkUpBreadthFirst('C')]).toEqual([
			'C',
			'B',
			'A',
		])
	})

	it('includes the starting node when it has no relations', () => {
		let dag = new DAG<string>()

		expect([...dag.walkDownDepthFirst('A')]).toEqual(['A'])
		expect([...dag.walkDownBreadthFirst('A')]).toEqual(['A'])

		expect([...dag.walkUpDepthFirst('A')]).toEqual(['A'])
		expect([...dag.walkUpBreadthFirst('A')]).toEqual(['A'])
	})

	it('ignores self-relations', () => {
		let dag = new DAG<string>()

		dag.add('A', 'A')

		expect([...dag.walkDownDepthFirst('A')]).toEqual(['A'])
		expect([...dag.walkUpDepthFirst('A')]).toEqual(['A'])
	})

	it('does not duplicate relations added more than once', () => {
		let dag = new DAG<string>()

		dag.add('B', 'A')
		dag.add('B', 'A')
		dag.add('B', 'A')

		expect([...dag.walkDownBreadthFirst('A')]).toEqual([
			'A',
			'B',
		])

		expect([...dag.walkUpBreadthFirst('B')]).toEqual([
			'B',
			'A',
		])
	})

	it('works with non-string node values', () => {
		let dag = new DAG<number>()

		dag.add(2, 1)
		dag.add(3, 1)
		dag.add(4, 2)

		expect([...dag.walkDownBreadthFirst(1)]).toEqual([
			1,
			2,
			3,
			4,
		])

		expect([...dag.walkUpDepthFirst(4)]).toEqual([
			4,
			2,
			1,
		])
	})

	it('does not recurse forever if malformed data contains a cycle', () => {
		let dag = new DAG<string>()

		/*
		 * A → B → C
		 * ↑       ↓
		 * └───────┘
		 */
		dag.add('B', 'A')
		dag.add('C', 'B')
		dag.add('A', 'C')

		expect([...dag.walkDownDepthFirst('A')]).toEqual([
			'A',
			'B',
			'C',
		])

		expect([...dag.walkDownBreadthFirst('A')]).toEqual([
			'A',
			'B',
			'C',
		])
	})

	it('returns downward distances by level', () => {
		let dag = new DAG<string>()

		/*
		 *         A
		 *       /   \
		 *      B     C
		 *     / \     \
		 *    D   E     F
		 *        |
		 *        G
		 */
		dag.add('B', 'A')
		dag.add('C', 'A')
		dag.add('D', 'B')
		dag.add('E', 'B')
		dag.add('F', 'C')
		dag.add('G', 'E')

		expect(dag.walkDownWithDistances('A')).toEqual(new Map([
			['A', 0],
			['B', 1],
			['C', 1],
			['D', 2],
			['E', 2],
			['F', 2],
			['G', 3],
		]))
	})

	it('returns upward distances by level', () => {
		let dag = new DAG<string>()

		/*
		* A → B ─┐
		*         ├→ E
		* C → D ─┘
		*
		* F → C
		*/
		dag.add('B', 'A')
		dag.add('E', 'B')

		dag.add('D', 'C')
		dag.add('E', 'D')

		dag.add('C', 'F')

		expect(dag.walkUpWithDistances('E')).toEqual(new Map([
			['E', 0],
			['B', 1],
			['D', 1],
			['A', 2],
			['C', 2],
			['F', 3],
		]))
	})
})