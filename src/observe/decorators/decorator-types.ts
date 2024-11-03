/** 
 * `@computed` decorates a class getter to make it compute value when required.
 * Compare with `get property() {...}`, computed property value will be cached,
 * and refresh only when required.
 * 
 * The computed value will be cleared each time after any visited dependencies get changed.
 * 
 * Decorated method can be overwritten, but should also be decorated.
 * 
 * So if your computing is expensive, and don't like re-computing each time
 * after re-connected, consider using `@watch` or `@immediateWatch`.
 * 
 * This is only a declaration, it will be replaced after compiled by `@pucelle/lupos.compiler`.
 */
export declare function computed(originalGetter: any, context: ClassGetterDecoratorContext): any


/** 
 * `@effect` decorates a class method, it execute this method,
 * and if any dependency it used get changed, re-execute this method.
 * 
 * The effect action will be activated after instance initialized, in declaration order,
 * and to be enqueued each time after any visited dependencies get changed.
 * 
 * So if your effect method is expensive, and don't like re-computing each time
 * after re-connected, consider using `@watch` or `@immediateWatch`.
 * 
 * This is only a declaration, it will be replaced after been compiled by `@pucelle/lupos.compiler`.
 */
export declare function effect(originalMethod: any, context: ClassMethodDecoratorContext): any


/** 
 * `@watch` decorates a class method to watch a property, or returned value of a fn,
 * and calls current method after this value becomes changed.
 * 
 * Use it like:
 * ```
 * @watch('publicProperty')
 * onPropertyChange(propertyValue) {...}
 * 
 * @watch('publicProperty1', 'publicProperty2')
 * onPropertyChange(publicPropertyValue1, publicPropertyValue2) {...}
 * 
 * @watch(function(this: C) {return this.property}, ...)
 * onPropertyChange(watchFnReturnedValue) {...}
 * ```
 * 
 * The watch action will be activated after instance initialized,
 * in declaration order, and to be called in the update queue.
 * and later be enqueued again when any visited dependencies get changed.
 * 
 * Otherwise current watch action would can't be released and GC if any dependencies still existing.
 * If you want to make sure watching things can be released, use `Watcher` apis and release it yourself.
 * 
 * This is only a declaration, it will be replaced after been compiled by `@pucelle/lupos.compiler`.
 */
export declare function watch<T, PS extends (((this: T) => any) | keyof T)[]>(...fnOrProps: PS):
	(originalMethod: InferMethod<T, PS>, context: ClassMethodDecoratorContext<T>) => any

/** Infer method declaration by class T, and properties PS. */
type InferMethod<T, PS extends ((() => any) | keyof T)[]>
	= (...args: InferMethodParameters<T, PS>) => void

/** Infer method parameters by class T, and properties PS. */
type InferMethodParameters<T, PS extends ((() => any) | keyof T)[]>
	= {[K in keyof PS]: InferPropertyType<T, PS[K]>}

/** Infer property types by class T, and properties PS. */
type InferPropertyType<T, P extends ((() => any) | keyof T)>
	= P extends (() => any) ? ReturnType<P> : P extends keyof T ? T[P] : any
