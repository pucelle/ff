/** 
 * If type of a variable / property / parameter is marked as `Observed<>`,
 * or a class declaration implements `Observed`,
 * then in current context, normally a function or method, or a class range,
 * 
 * After compiled by `@pucelle/lupos.compiler`, objects marked as observed type
 * will be tracked mutations of it's sub properties, include descendant properties.
 */
export type Observed<T extends object = object> = T


/** Make an object and all of it's properties and descendant properties readonly. */
export type DeepReadonly<T> = Readonly<{
	[K in keyof T]:

		// primitive
		T[K] extends (number | string | symbol) ? Readonly<T[K]>

		// Array
		: T[K] extends Array<infer A> ? Readonly<Array<DeepReadonly<A>>>
		
		// normal object
		: DeepReadonly<T[K]>
}>