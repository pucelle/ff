import {DependencyTracker} from './dependency-tracker'


/** 
 * Make a similar computed getter from a getter function.
 * and automatically re-computing the value after any dependency changed.
 */
export function compute<V = any>(getter: () => V): () => V {
	let value: V | undefined = undefined
	let valueReset = true

	let resetValue = function() {
		value = undefined
		valueReset = true
	}

	return function() {
		if (valueReset) {
			DependencyTracker.trackExecutionOf(function() {
				value = getter()
			}, resetValue)

			valueReset = false
		}

		return value!
	}
}
