import {SetMap} from './map'


type WalkDirection = 'up' | 'down'
type WalkStrategy = 'depth-first' | 'breadth-first'


/** 
 * DAG - Directed Acyclic Graph:
 * each parent connect with several children,
 * and a node may also connect with descendants.
 * 
 * A → B → C
 * └─────→ C
 */
export class DAG<T> {

	protected children: SetMap<T, T> = new SetMap()
	protected parents: SetMap<T, T> = new SetMap()

	/** Add a child -> parent map. */
	add(childNode: T, parentNode: T) {
		if (childNode === parentNode) {
			return
		}

		this.children.add(parentNode, childNode)
		this.parents.add(childNode, parentNode)
	}

	/** Walk self and descendants using depth-first traversal. */
	walkDownDepthFirst(fromNode: T): Set<T> {
		return this.walk(fromNode, 'down', 'depth-first')
	}

	/** Walk self and ancestors using depth-first traversal. */
	walkUpDepthFirst(fromNode: T): Set<T> {
		return this.walk(fromNode, 'up', 'depth-first')
	}

	/** Walk self and descendants using breadth-first traversal. */
	walkDownBreadthFirst(fromNode: T): Set<T> {
		return this.walk(fromNode, 'down', 'breadth-first')
	}

	/** Walk self and ancestors using breadth-first traversal. */
	walkUpBreadthFirst(fromNode: T): Set<T> {
		return this.walk(fromNode, 'up', 'breadth-first')
	}

	/** Walk self and descendants using breadth-first traversal, also output distance. */
	walkDownWithDistances(fromNode: T): Map<T, number> {
		return this.walkWithDistanceBreadthFirst(fromNode, 'down')
	}

	/** Walk self and ancestors using breadth-first traversal, also output distance. */
	walkUpWithDistances(fromNode: T): Map<T, number> {
		return this.walkWithDistanceBreadthFirst(fromNode, 'up')
	}

	private walk(
		fromNode: T,
		direction: WalkDirection,
		strategy: WalkStrategy,
	): Set<T> {
		let relations = direction === 'down'
			? this.children
			: this.parents

		if (strategy === 'breadth-first') {
			return this.walkBreadthFirst(fromNode, relations)
		}
		else {
			return this.walkDepthFirst(fromNode, relations)
		}
	}

	private walkDepthFirst(
		fromNode: T,
		relations: SetMap<T, T>,
	): Set<T> {
		let walked = new Set<T>()
		let stack: T[] = [fromNode]

		while (stack.length > 0) {
			let node = stack.pop()!

			if (walked.has(node)) {
				continue
			}

			walked.add(node)

			let relatedNodes = [...relations.get(node) ?? []]

			/*
			 * Push in reverse order so the first inserted relation
			 * is visited first.
			 */
			for (let i = relatedNodes.length - 1; i >= 0; i--) {
				let relatedNode = relatedNodes[i]

				if (!walked.has(relatedNode)) {
					stack.push(relatedNode)
				}
			}
		}

		return walked
	}

	private walkBreadthFirst(
		fromNode: T,
		relations: SetMap<T, T>,
	): Set<T> {
		let walked = new Set<T>()
		let queue: T[] = [fromNode]
		let queueIndex = 0

		while (queueIndex < queue.length) {
			let node = queue[queueIndex++]

			if (walked.has(node)) {
				continue
			}

			walked.add(node)

			for (let relatedNode of relations.get(node) ?? []) {
				if (!walked.has(relatedNode)) {
					queue.push(relatedNode)
				}
			}
		}

		return walked
	}

	private walkWithDistanceBreadthFirst(
		fromNode: T,
		direction: WalkDirection
	): Map<T, number> {
		let relations = direction === 'down'
			? this.children
			: this.parents

		let distances = new Map<T, number>([
			[fromNode, 0],
		])

		let queue: T[] = [fromNode]
		let queueIndex = 0

		while (queueIndex < queue.length) {
			let node = queue[queueIndex++]
			let distance = distances.get(node)!

			for (let relatedNode of relations.get(node) ?? []) {

				// The first BFS visit is always through a shortest path.
				if (distances.has(relatedNode)) {
					continue
				}

				distances.set(relatedNode, distance + 1)
				queue.push(relatedNode)
			}
		}

		return distances
	}
}