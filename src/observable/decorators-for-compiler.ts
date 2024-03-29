/** 
 * `@observable` decorates a class to make its properties become observable.
 * 
 * If a class is decorated as observable, its all public properties becomes
 * readonly outside of class private scope, except decorates properties as `@input`.
 * 
 * This is only a marker, it will be removed after compiled to js codes by `@pucelle/lupos-compiler`.
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
 * This is only a marker, it will be removed after compiled to js codes by `@pucelle/lupos-compiler`.
 */
export function input(_target: any, _property: string) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}


/** 
 * `@computed` decorates a property to make it compute value when required.
 * Compare with `get property() {...}`, computed property can be
 */
export function computed(_target: any, _property: string) {
	throw new Error(`Please install "@pucelle/lupos-compiler" to compile your typescript codes!`)
}

