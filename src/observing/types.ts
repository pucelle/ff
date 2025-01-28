/** 
 * If type of a variable / property / parameter is marked as `Observed<>`,
 * or a class declaration implements `Observed`,
 * then in current context, normally a function or method, or a class range,
 * after compiled by `@pucelle/lupos.compiler`, objects marked as observed type,
 * and mutations of it's sub properties, include descendant properties will be tracked.
 */
export type Observed<T extends object = object> = T


/** 
 * It a class implements `MethodsHalfObserved`,
 * or an value declared with type `MethodsHalfObserved`
 * if call methods listed in `GetMethods`, will track get with empty string as key,
 * if call methods listed in `SetMethods`, will track set with empty string as key.
 * 
 * Otherwise, this implement doesn't affect class compiling,
 * but affect the place where use the instance of current class.
 * That's why it is called "half observed."
 */
export type MethodsHalfObserved<GetMethods, SetMethods>
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