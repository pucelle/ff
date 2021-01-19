/** Replace `$0` to `matches[0]`, `$1` to `matches[1]`... */
function replaceMatchTags(template: string, match: RegExpExecArray | RegExpMatchArray) {
	return template.replace(/\$(?:([$&\d])|<(\w+)>)/g, (_m0, m1, m2) => {
		if (m2) {
			return match.groups ? match.groups[m2] || '' : ''
		}
		else if (m1 === '$') {
			return '$'
		}
		else if (m1 === '&') {
			return match[0]
		}
		else {
			return typeof match[m1] === 'string' ? match[m1] : ''
		}
	})
}


/**
 * Select sub matches from `string` by matching `re`, then format with a `template` string.
 * Returns the format result.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param template Replace `$i` or `$<name>` to corresponding match.
 */
export function select(string: string, re: RegExp, template: string): string {
	let match: RegExpExecArray |  null = re.exec(string)

	return match ? replaceMatchTags(template, match) : ''
}


/**
 * Select all the sub matches from `string` by matching `re`, then format with a `template` string.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param template Replace `$i` or `$<name>` to corresponding match.
 */
export function selectAll(string: string, re: RegExp, template: string): string[] {
	if (re.global) {
		let match: RegExpExecArray |  null
		let matches: string[] = []

		while (match = re.exec(string)) {
			matches.push(replaceMatchTags(template, match))
		}

		return matches
	}

	else {
		let match: RegExpMatchArray | null = string.match(re)
		if (match) {
			return [replaceMatchTags(template, match)]
		}
		else {
			return []
		}
	}
}


/**
 * Returns the sub match in specified `index` from executing `re` on `string`.
 * @param string The string to select sub match.
 * @param re The RegExp to execute on string.
 * @param index Select the sub match in the index from match resul.
 */
export function subMatchAt(string: string, re: RegExp, index: number): string {
	return re.exec(string)?.[index] || ''
}


/**
 * Returns the first sub match from executing `re` on `string`.
 * @param string The string to select sub match.
 * @param re The RegExp to execute on string.
 */
export function firstMatch(string: string, re: RegExp): string {
	return subMatchAt(string, re, 1)
}


/**
 * For each match result from executing `re` on `string`, picks specified `index` of sub matches.
 * Rreturns array of picked items.
 * @param string The string to select sub match.
 * @param re The RegExp to execute on string.
 * @param index Select the sub match in the index from each match result.
 */
export function subMatchesAt(string: string, re: RegExp, index: number): string[] {
	if (re.global) {
		let match: RegExpExecArray |  null
		let matches: string[] = []

		while (match = re.exec(string)) {
			matches.push(match[index] || '')
		}

		return matches
	}
	else {
		let match: RegExpMatchArray | null = string.match(re)
		if (match) {
			return [match[index] || '']
		}
		else {
			return []
		}
	}
}


/**
 * Returns array of all the sub matches from executing `re` on `string`.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param sliceIndex Slice each match result from, specify to `0` to include whole match, `1` to only include sub matches, default value is `1`.
 */
export function subMatches(string: string, re: RegExp, sliceIndex: number = 1): string[][] {
	if (re.global) {
		let match: RegExpExecArray |  null
		let matches: string[][] = []

		while (match = re.exec(string)) {
			matches.push([...match].slice(sliceIndex))
		}

		return matches
	}
	else {
		let match: RegExpMatchArray | null = string.match(re)
		if (match) {
			return [[...match].slice(sliceIndex)]
		}
		else {
			return []
		}
	}
}


/**
 * Format string to replace placeholders like `{key}` in `template` to `args[key]`.
 * Will keep the placeholder when no match found.
 * @param template String to format.
 * @param args The parameters to find and replace `{...}` with.
 */
export function format(template: string, args: Record<string, string | number> | (string | number)[]): string {
	return template.replace(/\{(\w+)\}/g, (m0: string, m1: string) => {
		let value = (args as any)[m1]
		if (value === undefined) {
			value = m0
		}
		return value
	})
}


/**
 * Get the left part of `string` before the first matched `substring`.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If `true`, when substring can't be found, returns the whole string.
 */
export function before(string: string, substring: string, greedy: boolean = false): string {
	let index = string.indexOf(substring)

	if (index < 0) {
		return greedy ? string : ''
	}
	else {
		return string.slice(0, index)
	}
}


/**
 * Get the right part of `string` before the first matched `substring`.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If `true`, when substring can't be found, returns the whole string.
 */
export function after(string: string, substring: string, greedy: boolean = false): string {
	let index = string.indexOf(substring)

	if (index < 0) {
		return greedy ? string : ''
	}
	else {
		return string.slice(index + substring.length)
	}
}


/**
 * Get the left part of `string` before the last matched `substring`.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If `true`, when substring can't be found, returns the whole string.
 */
export function beforeLast(string: string, substring: string, greedy: boolean = false): string {
	let index = string.lastIndexOf(substring)

	if (index < 0) {
		return greedy ? string : ''
	}
	else {
		return string.slice(0, index)
	}
}


/**
 * Get the right part of `string` before the last matched `substring`.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If `true`, when substring can't be found, returns the whole string.
 */
export function afterLast(string: string, substring: string, greedy: boolean = false): string {
	let index = string.lastIndexOf(substring)

	if (index < 0) {
		return greedy ? string : ''
	}
	else {
		return string.slice(index + 1)
	}
}


/**
 * Uppercase the first character of `string`.
 * @param string The string to be capitalized.
 */
export function capitalize(string: string): string {
	return string.slice(0, 1).toUpperCase() + string.slice(1).toLowerCase()
}


/**
 * Transform `string` to camer case type.
 * @param string The string to transform.
 */
export function toCamerCase(string: string): string {
	return string.replace(/[-_ ][a-z]/gi, m0 => m0[1].toUpperCase())
}


/**
 * Transform `string` to dash case type by joining words with `-`.
 * @param string The string to transform.
 */
export function toDashCase(string: string): string {
	return string.replace(/(^|.)([A-Z]+)/g, (m0: string, charBefore: string | undefined, upperChars: string) => {
		if (charBefore && /[a-z ]/i.test(charBefore)) {
			return charBefore + '-' + upperChars.toLowerCase()
		}
		else {
			return m0.toLowerCase()
		}
	})
	.replace(/_/g, '-')
}


/**
 * Transform `string` to dash case by joining words with `_`.
 * @param string The string to transform.
 */
export function toUnderscoreCase(string: string): string {
	return toDashCase(string).replace(/-/g, '_')
}