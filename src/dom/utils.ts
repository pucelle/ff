/** Format number type value to a standard style value. */
export function normativeStyleValue(property: string, value: string | number): string {
	if (typeof value === 'number' && /(?:width|height|left|right|top|bottom|size)$/i.test(property)) {
		value = value + 'px'
	}
	else {
		value = value.toString()
	}
	return value
}


/** Format number type value of the object to a standard style value. */
export function normativeStyleObject(styleObject: Record<string, string | number>): Record<string, string> {
	for (let property of Object.keys(styleObject)) {
		styleObject[property] = normativeStyleValue(property, styleObject[property])
	}
	return styleObject as Record<string, string>
}