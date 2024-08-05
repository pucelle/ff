/** 
 * Decorate a class property to declare a context variable,
 * this property can be shared with all descendant components,
 * after declared `@useContext property` at descendant components.
 */
export declare function setContext(target: any, context: ClassFieldDecoratorContext): void

/** 
 * Decorate a class property to reference a context variable,
 * this property was declared by any level of ancestral components
 * use `@setContext property`.
 */
export declare function useContext(target: any, context: ClassFieldDecoratorContext): void


/** The component constructor that can set and use context variable. */
export interface ContextVariableConstructor<T extends object = object> {

	/** 
	 * After a source component connected,
	 * set context variables declared by `@setContext`.
	 */
	setContextVariable(com: T, prop: PropertyKey): void

	/**
	 * Get source component where declares `@setContext prop`,
	 * from it's descendant component which declares `@useContext prop`.
	 */
	getContextVariableDeclared(com: T, prop: PropertyKey): T | undefined

	/** 
	 * After component disconnected,
	 * delete it's context variables.
	 */
	deleteContextVariables(com: T): void
}