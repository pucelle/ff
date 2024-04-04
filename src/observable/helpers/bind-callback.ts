import {WeakerDoubleKeysMap} from '../../structs'


/** Caches all binded callbacks, `Callback -> Scope -> Binded Callback`. */
const BindedCallbackMap: WeakerDoubleKeysMap<Function, object, Function> = new WeakerDoubleKeysMap()


/** 
 * Bind a callback and a scope to get a new callback function.
 * 
 * Will cache reuslt and always get same result for same parameters.
 */
export function bindCallback<T extends Function>(callback: T, scope: object | null): T {
	if (!scope) {
		return callback
	}

	let bindedCallback = BindedCallbackMap.get(callback, scope) as T | undefined			
	if (!bindedCallback) {
		bindedCallback = callback.bind(scope) as T
		BindedCallbackMap.set(callback, scope, bindedCallback)
	}

	return bindedCallback
}
