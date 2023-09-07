/** 
 * Apply mixins to support multiple extends.
 * if want class C extends A, B, use it like `applyMixins(C, [A, B])`,
 * and don't forget to declare a interface `C extends A, B`.
 * Order of `A, B` matters, the following one overwrite preceding one.
 * 
 * Note can't declare `constructor` in extend classes,
 * can use other methods like `__init` instead.
 * 
 * Note class extends methods, accessors in prototypes,
 * no properties or property decorators will extend.
 * You must call constructors of `extendList` to make mixin properties got initialized.
 * 
 * Otherwise, if constructors in extendList share same super class,
 * be carefull about calling both constructor.
 * And strongly suggest only declare a minin class not that extends any super to apply.
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