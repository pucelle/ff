/** 
 * `Observed` means we are observing this object, and can track all the
 * mutations of it's properties, and sub properties.
 * 
 * You may declare a variable / property / parameter as `Observed<...>` type,
 * or use as expression `a as Observed<...>`,
 * or make a class declaration implements `Observed`,
 * or make a type parameter extends `Observed<...>`.
 * 
 * Code must be compiled by `@pucelle/lupos.compiler` to work.
 */
export type Observed<T extends object = object> = T


/** 
 * `UnObserved` means we will stop observe this object.
 * 
 * You may declare a variable / property / parameter as `UnObserved<...>` type,
 * or use as expression `a as UnObserved<...>`,
 * or make a class declaration implements `UnObserved` to overwrite super,
 * or make a type parameter extends `UnObserved<...>`.
 */
export type UnObserved<T extends object = object> = T



/** 
 * It a class implements `MethodsObserved<>`, it indicates which methods
 * cause elements getting action, and which cause elements setting action.
 * This make a class works like a `Map` or `Set` to do elements get and set tracking.
 * 
 * To make it work, you should also make sure the instance becomes `Observed`.
 * 
 * Otherwise, this implement doesn't affect codes compiling,
 * but affect the place where use the instance of this class.
 */
export type MethodsObserved<GetMethods, SetMethods>
	= {[K in (GetMethods extends string ? GetMethods : never) | (SetMethods extends string ? SetMethods : never)]: Function}


/** Make an object and all of it's properties and descendant properties readonly. */
export type DeepReadonly<T> = Readonly<{
	[K in keyof T]:

		// primitive
		T[K] extends (number | string | symbol | null | undefined) ? T[K]

		// Array
		: T[K] extends Array<infer A> ? Readonly<Array<DeepReadonly<A>>>
		
		// normal object
		: DeepReadonly<T[K]>
}>