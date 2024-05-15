/** 
 * If type of a parameter is marked as `Observed`,
 * then in the current context, normally a function or method, or a class range,
 * compiler will track it's sub properties' reading and writing process.
 */
export type Observed<T extends object> = T