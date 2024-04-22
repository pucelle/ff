/** 
 * `@observable` decorates a class to make its properties become observable.
 * 
 * If a class is decorated as observable, its all public properties becomes
 * readonly outside of class private scope, except decorates properties as `@input`.
 * 
 * This is only an identifier, it will be removed after compiled to js codes by `@pucelle/lupos-compiler`.
 */
export function observable(_constructor: Function) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}


/** 
 * `@input` decorates a property to make it can be assigned outside of class private scope.
 * 
 * If a class is decorated by `@observable`, its all public properties becomes
 * readonly outside of class private scope, except decorates properties as `@input`.
 * 
 * This is only an identifier, it will be removed after compiled to js codes by `@pucelle/lupos-compiler`.
 */
export function input(_target: any, _property: string) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}


/** 
 * `@computed` decorates a property to make it compute value when required.
 * Compare with `get property() {...}`, computed property will be cached, and refresh only when required.
 */
export function computed(_target: any, _property: string) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}


/** 
 * `@watch` decorates a property to watch the setting of this value,
 * and calls callback after this value becomes changed.
 * 
 * The watch action will be started after instance initialized,
 * so applying properties in `constructor` will not cause callback be called.
 */
export function watch<T>(_fnOrProperty: (() => T) | PropertyKey, _callback: (newValue: T, oldValue: T) => void) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}