/** 
 * `@observable` decorates a class to make its properties become observable.
 * 
 * If a class is decorated as observable, its all public properties becomes
 * readonly outside of class private scope, except decorates properties as `@input`.
 * 
 * This is only an identifier, it will be removed after compiled to js codes by `@pucelle/lupos-compiler`.
 */
export declare function observable(constructor: Function): void


/** 
 * `@input` decorates a class property to make it can be assigned outside of class private scope.
 * 
 * If a class is decorated by `@observable`, its all public properties becomes
 * readonly outside of class private scope, except decorates properties as `@input`.
 * 
 * This is only an identifier, it will be removed after compiled to js codes by `@pucelle/lupos-compiler`.
 */
export declare function input(target: any, property: string): void


/** 
 * `@computed` decorates a class getter to make it compute value when required.
 * Compare with `get property() {...}`, computed property will be cached, and refresh only when required.
 */
export declare function computed(target: any, property: string): void


/** 
 * `@effect` decorates a class method, it execute this method,
 * and if any dependency it used get changed, re-execute this method.
 * 
 * The effect action will be started after instance initialized,
 * so applying properties in `constructor` will not cause this method be called.
 */
export declare function effect(target: any, property: string): void


/** 
 * `@watch` decorates a class method to watch a property, or returned value of a fn,
 * and calls current method after this value becomes changed.
 * 
 * Use it like:
 * - `@watch('property') onPropertyChange() {...}`
 * - `@watch(function(this: C) {return this.property}) onPropertyChange() {...}`
 * 
 * The watch action will be started after instance initialized,
 * so applying properties in `constructor` will not cause callback be called.
 */
export declare function watch(fnOrProperty: (() => any) | PropertyKey, immediate?: boolean): void