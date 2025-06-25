/**
 * Format string to replace placeholders like `{key}` in `template` to `params[key]`.
 * Will keep the placeholders if no match found, so a template can be formatted by a parameter sequence.
 */
export function format(template: string, params: Record<string, string | number> | (string | number)[]): string {
	return template.replace(/\{(\w+)\}/g, function(m0: string, m1: string) {
		let value = (params as any)[m1]
		if (value === undefined) {
			value = m0
		}
		return value
	})
}



/** Encode `<>` to `&...` to make sure HTML codes are safely to be appended into document. */
export function encodeHTML(code: string): string {
	return code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Decode HTML codes which includes `&...` to be content characters.
 * Otherwise it will remove all the html tags.
 * Note this is a very slow method.
 */
export function decodeHTML(code: string): string {
	let parser = new DOMParser()
	let dom = parser.parseFromString(`<!DOCTYPE html><body>${code}</body></html>`, 'text/html')
	return dom.body.textContent!
}



/** Uppercase the first character of `string`: `abc` -> `Abc` */
export function toCapitalize(string: string): string {
	return string.slice(0, 1).toUpperCase() + string.slice(1)
}

/** Convert `string` to camel case type: `a-bc` -> `abc`. */
export function toCamelCase(string: string): string {
	return string.replace(/[-_ ][a-z]/gi, m0 => m0[1].toUpperCase())
}

/** Convert `string` to dash case type by joining words with `-`: `a bc` -> `a-bc`. */
export function toDashCase(string: string): string {
	return string.replace(/(^|.)([A-Z]+)/g, function(m0: string, charBefore: string | undefined, upperChars: string) {
		if (charBefore && /[a-z ]/i.test(charBefore)) {
			return charBefore + '-' + upperChars.toLowerCase()
		}
		else {
			return m0.toLowerCase()
		}
	})
	.replace(/[_ ]/g, '-')
}

/** Convert `string` to underscore case by joining words with `_`: `a bc` -> `a_bc`. */
export function toUnderscoreCase(string: string): string {
	return toDashCase(string).replace(/-/g, '_')
}
