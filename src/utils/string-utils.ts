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



/** Uppercase the first character of `string`: `abc` -> `Abc` */
export function toCapitalize(string: string): string {
	return string.slice(0, 1).toUpperCase() + string.slice(1)
}

/** Convert `string` to camel case type: `a-bc` -> `abc`. */
export function toCamelCase(string: string): string {
	return string.replace(/[’']/g, '')
		.replace(/[-_ ][a-z]/gi, m0 => m0[1].toUpperCase())
}

/** Convert `string` to dash case type by joining words with `-`: `a bc` -> `a-bc`. */
export function toDashCase(string: string): string {
	return string.replace(/[’']/g, '')
		.replace(/(^|.)([A-Z]+)/g, function(m0: string, charBefore: string | undefined, upperChars: string) {
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


/** Guess text width in em. */
export function estimateTextWidthEM(text: string): number {
	let width = 0

	for (const char of text) {

		// Chinese / Japanese / Korean
		if (/[\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u30FF\uAC00-\uD7AF]/u.test(char)) {
			width += 1.05
		}
		else if (/[A-Z]/.test(char)) {
			width += 0.8
		}
		else if (/[a-z0-9]/.test(char)) {
			width += 0.6
		}
		else if (/\s/.test(char)) {
			width += 0.3
		}

		// punctuation / symbols
		else {
			width += 0.5
		}
	}

	return width
}


/** 
 * Hash a string to a hash string.
 * Good for cache keys, IDs, deterministic colors, etc.
 * But it's not cryptographically secure.
 */
export function hashToString(str: string): string {
    return hashToNum(str).toString(16)
}


/** 
 * Hash a string to get a number.
 * Good for cache keys, IDs, deterministic colors, etc.
 * But it's not cryptographically secure.
 */
export function hashToNum(str: string): number {
    let hash = 0x811c9dc5

    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
    }

    return hash >>> 0
}
