export function normativeStyleValue(property: string, value: string | number): string {
	if (typeof value === 'number' && /(?:width|height|left|right|top|bottom|size)$/i.test(property)) {
		value = value + 'px'
	}
	else {
		value = value.toString()
	}
	return value
}

export function normativeStyleObject(styleObject: Record<string, string | number>): Record<string, string> {
	for (let property of Object.keys(styleObject)) {
		styleObject[property] = normativeStyleValue(property, styleObject[property])
	}
	return styleObject as Record<string, string>
}


export function getClosestFixedElement(el: Element): HTMLElement | null {
	while (el && el !== document.documentElement) {
		if (getComputedStyle(el).position === 'fixed') {
			break
		}
		el = el.parentElement!
	}

	return el === document.documentElement ? null : el as HTMLElement
}