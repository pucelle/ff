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
 * `@computed` decorates a getter to make it compute value when required.
 * Compare with `get property() {...}`, computed property will be cached, and refresh only when required.
 */
export function computed(_target: any, _property: string) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}


/** 
 * `@effect` decorates a method, it execute this method,
 * and if any depedency it used get changed, re-execute this method.
 * 
 * The effect action will be started after instance initialized,
 * so applying properties in `constructor` will not cause this method be called.
 */
export function effect(_target: any, _property: string) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}


/** 
 * `@watch` decorates a method to watch a property, or returned value of a fn,
 * and calls current method after this value becomes changed.
 * 
 * Use it like:
 * - `@watch('property') onProperyChange() {...}`
 * - `@watch(function(this: C) {return this.property}) onProperyChange() {...}`
 * 
 * The watch action will be started after instance initialized,
 * so applying properties in `constructor` will not cause callback be called.
 */
export function watch(_fnOrProperty: (() => any) | PropertyKey, _immediate?: boolean) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}