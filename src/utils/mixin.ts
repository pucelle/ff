/** 
 * Apply mixins to support multiple extends.
 * if wants class C extends A, B, doing extends by using `applyMixins(C, [A, B])`,
 * and don't forget to declare `interface C extends A, B`.
 * Order of `A, B` matters, the following one overwrite preceding one.
 * 
 * Note can't declare `constructor` in the classes that used to be extended,
 * can use other methods like `__init` instead.
 * So you should initialize all properties in this `__init` method.
 */
export function applyMixins(classDeclaration: any, ...extendList: any[]) {
	for (let extend of extendList.reverse()) {
		for (let propertyName of Object.getOwnPropertyNames(extend.prototype)) {
			if (classDeclaration.prototype.hasOwnProperty(propertyName)) {
				continue
			}
			
			Object.defineProperty(
				classDeclaration.prototype,
				propertyName,
				Object.getOwnPropertyDescriptor(extend.prototype, propertyName) || Object.create(null)
			)
		}
	}
}