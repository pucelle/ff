/** 
 * `@computed` decorates a class getter to make it compute value when required.
 * Compare with `get property() {...}`, computed property value will be cached,
 * and refresh only when required.
 * 
 * The computed value will be cleared each time after any visited dependencies get changed.
 * 
 * Decorated method can be overwritten, but should be decorated again.
 * 
 * If use with a component which has life-cycle, like a `Component` in Lupos.js,
 * computed value will be cleared after component disconnected,
 * and re-compute after component re-connected.
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
 * If use with a component which has life-cycle, like a `Component` in Lupos.js,
 * current effect action will be deactivated after component disconnected,
 * and be activated by running effect method after component connected.
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
 * @watch('property')
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
 * If use with a component which has life-cycle, like a `Component` in `@pucelle/lupos.js`,
 * current watch action will be deactivated after component disconnected,
 * and after component connected, will compare values of watching properties or getters,
 * if any changed, call watch decorated method.
 * 
 * Otherwise current watch action would can't be released and GC if any dependencies still existing.
 * If you want to make sure watching things can be released, use `Watcher` apis and release it yourself.
 * 
 * This is only a declaration, it will be replaced after been compiled by `@pucelle/lupos.compiler`.
 */
export declare function watch<T, PS extends (((this: T) => any) | keyof T)[]>(...fnOrProps: PS):
	(originalMethod: InferMethod<T, PS>, context: ClassMethodDecoratorContext<T>) => any

type InferMethod<T, PS extends ((() => any) | keyof T)[]>
	= (...args: InferMethodParameters<T, PS>) => void

type InferMethodParameters<T, PS extends ((() => any) | keyof T)[]>
	= {[K in keyof PS]: InferPropertyType<T, PS[K]>}

type InferPropertyType<T, P extends ((() => any) | keyof T)>
	= P extends (() => any) ? ReturnType<P> : P extends keyof T ? T[P] : any

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
 * The watch action will be enqueued after instance initialized,
 * and to be called in the update queue.
 * and later be enqueued again when any visited dependencies get changed.
 * 
 * Different with `@watch`, this decorator will also call decorated method
 * for the first time when initializing.
 * 
 * If use with a component which has life-cycle, like a `Component` in `@pucelle/lupos.js`,
 * current watch action will be deactivated after component disconnected,
 * and after component connected, will compare values of watching properties or getters,
 * if any changed, call watch decorated method.
 * 
 * Otherwise current watch action would can't be released and GC if any dependencies still existing.
 * If you want to make sure watching things can be released, use `Watcher` apis and release it yourself.
 * 
 * This is only a declaration, it will be replaced after been compiled by `@pucelle/lupos.compiler`.
 */
export declare function immediateWatch<T, PS extends (((this: T) => any) | keyof T)[]>(...fnOrProps: PS):
	(originalMethod: InferMethod<T, PS>, context: ClassMethodDecoratorContext<T>) => any