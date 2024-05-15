/** 
 * `@observable` decorates a class to make itself and all of its properties
 * and descendent properties to make them become `Observed<...>`,
 * then all the mutations of these properties will be tracked.
 * 
 * By default, `Component` of Lupos.js and all of it's derived classes are mutable, no need to decorate again.
 * 
 * `@observable` will not broadcast to derived classes, you must set it independently.
 * 
 * This is only a declaration, it will be removed after compiled.
 */
export declare function observable(constructor: Function, context: ClassDecoratorContext): void


/** 
 * `@computed` decorates a class getter to make it compute value when required.
 * Compare with `get property() {...}`, computed property value will be cached,
 * and refresh only when required.
 * 
 * This is only a declaration, it will be removed after compiled.
 */
export declare function computed(originalMethod: any, context: ClassMethodDecoratorContext): any


/** 
 * `@effect` decorates a class method, it execute this method,
 * and if any dependency it used get changed, re-execute this method.
 * 
 * The effect action will be started after instance initialized,
 * so applying properties in `constructor` will not cause this method be called.
 * 
 * If use with a component has life-cycle, like a `Component` in Lupos.js,
 * current effect action can be activated and deactivated automatically follow component's life-cycle.
 * 
 * Otherwise current effect action would cant be released and GC if any dependencies still existing.
 * If you want to make sure an effect can be released, use `createEffect` and release it yourself.
 * 
 * This is only a declaration, it will be removed after compiled.
 */
export declare function effect(originalMethod: any, context: ClassMethodDecoratorContext): any


/** 
 * `@watch` decorates a class method to watch a property, or returned value of a fn,
 * and calls current method after this value becomes changed.
 * 
 * Use it like:
 * ```
 * @watch('property')
 * onPropertyChange() {...}
 * 
 * @watch(function(this: C) {return this.property})
 * onPropertyChange() {...}
 * ```
 * 
 * The watch action will be started after instance initialized,
 * so applying properties in `constructor` will not cause callback be called.
 * 
 * If use with a component has life-cycle, like a `Component` in `@pucelle/lupos.js`,
 * current watch action can be activated and deactivated automatically follow component's life-cycle.
 * 
 * Otherwise current watch action would cant be released and GC if any dependencies still existing.
 * If you want to make sure watching things can be released, use `Watcher` apis and release it yourself.
 * 
 * This is only a declaration, it will be removed after compiled.
 */
export declare function watch(fnOrProperty: (() => any) | PropertyKey, immediate?: boolean):
	(originalMethod: any, context: ClassMethodDecoratorContext) => any