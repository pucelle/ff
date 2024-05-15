/** 
 * If type of a variable / parameter is marked as `Observed<...>`,
 * then in current context, normally a function or method, or a class range,
 * compiler will track mutations of it's sub properties, include descendant properties.
 */
export type Observed<T extends object> = T


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