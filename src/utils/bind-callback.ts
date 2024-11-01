import {WeakerPairKeysMap} from '../structs'


/** Caches all bound callbacks, `Callback -> Scope -> Bound Callback`. */
const BoundCallbackMap: WeakerPairKeysMap<Function, object, Function> = new WeakerPairKeysMap()


/** 
 * Bind a callback and a scope to get a new callback function.
 * Will cache result and always get same result for same parameters.
 */
export function bindCallback<T extends Function>(callback: T, scope: object | null): T {
	if (!scope) {
		return callback
	}

	let boundCallback = BoundCallbackMap.get(callback, scope) as T | undefined			
	if (!boundCallback) {
		boundCallback = callback.bind(scope) as T
		BoundCallbackMap.set(callback, scope, boundCallback)
	}

	return boundCallback
}
