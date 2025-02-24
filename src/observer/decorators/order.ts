/** 
 * Increase and been added to order, to ensure output in the same order with adding
 * for those items with same `order` property.
 */
export let incrementalOrder = 0


/** Get an order for watchers, effectors, computers. */
export function getIncrementalOrder(): number {
	return incrementalOrder += Number.EPSILON
}