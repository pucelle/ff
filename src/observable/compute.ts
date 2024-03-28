import {DependencyCapturer} from './dependency-capturer'


/** 
 * Make a similar computed getter from a getter function.
 * and automatically re-computing the value after any dependency changed.
 */
export function compute<V = any>(getter: () => V): () => V {
	let value: V | undefined = undefined
	let assignValue = () => { value = getter() }

	let depCapCallback = () => {
		DependencyCapturer.captureExecutionOf(assignValue, depCapCallback)
	}

	return () => {

		// Assign value for the first time.
		if (value === undefined) {
			depCapCallback()
		}

		return value!
	}
}
