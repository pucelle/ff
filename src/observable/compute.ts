import * as DependencyTracker from './dependency-tracker'


/** 
 * Make a similar computed getter from a getter function.
 * and automatically re-computing the value after any dependency changed.
 */
export function createComputed<V = any>(getter: () => V): () => V {
	let value: V | undefined = undefined
	let valueReset = true

	function resetValue() {
		value = undefined
		valueReset = true
	}

	return function() {
		if (valueReset) {
			DependencyTracker.beginTrack(resetValue)
			try {
				value = getter()
			}
			catch (err) {
				console.log(err)
			}
			finally {
				DependencyTracker.endTrack()
			}

			valueReset = false
		}

		return value!
	}
}
