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
 * Select sub matches from `string` by `re`, then format a `template` with sub matches. returns the format result or results.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param template Replace `$i` or `$<name>` to corresponding match.
 */
export function select(string: string, re: RegExp, template: string): string | string[] {
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
			return replaceMatchTags(template, match)
		}
		else {
			return ''
		}
	}
}


/**
 * Returns specified index of sub match in `string` by executing `re`.
 * @param string The string to select sub match.
 * @param re The RegExp to execute on string.
 * @param index Select the sub match in the index from each match result or results.
 */
export function subMatchAt(string: string, re: RegExp, index: number = 0): string {
	let match = re.exec(string)
	if (match) {
		return match[index] || ''
	}
	else {
		return ''
	}
}


/**
 * Returns specified index of sub matches in `string` by executing `re`. Returns an array of matches.
 * @param string The string to select sub match.
 * @param re The RegExp to execute on string.
 * @param index Select the sub match in the index from each match result or results.
 */
export function subMatchesAt(string: string, re: RegExp, index: number = 0): string[] {
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
 * Returns all sub matches in `string` by executing `re`. Returns an array that includes sub matches when `re` is global.
 * @param string The string to select sub matches.
 * @param re The RegExp to execute on string.
 * @param sliceIndex Slice each match results from, specify to 0 to include whole match, 1 to only include sub matches.
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
 * Format string to replace placeholders `${key}` in `template` to `source[key]`. will keep the placeholders if no match found.
 * @param template String to format
 * @param source The data source.
 */
export function format(template: string, source: {[key: string]: string | number} | (string | number)[]): string {
	return template.replace(/\$\{(\w+)\}/g, (m0: string, m1: string) => {
		let value = (source as any)[m1]
		if (value === undefined) {
			value = m0
		}
		return value
	})
}


/**
 * Get the left part of string before substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
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
 * Get the right part of string before substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
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
 * Get the left part of string before the last substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
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
 * Get the right part of string before the last substring.
 * @param string The string to search substring.
 * @param substring The sub part to search in string.
 * @param greedy If true, when substring can't be found in string, returns the whole string.
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
 * Uppercase the first character.
 * @param string The string to be capitalized.
 */
export function capitalize(string: string): string {
	return string.slice(0, 1).toUpperCase() + string.slice(1)
}


/**
 * Transform the string to camer case type.
 * @param string The string to transform.
 */
export function toCamerCase(string: string): string {
	return string.replace(/[-_][a-z]/g, m0 => m0[1].toUpperCase())
}


/**
 * Transform the string to dash case by spliting words with `-`.
 * @param string The string to transform.
 */
export function toDashCase(string: string): string {
	return string.replace(/[A-Z]+/g, (m0: string, index: any) => {
		if (index > 0) {
			return '-' + m0.toLowerCase()
		}
		else {
			return m0.toLowerCase()
		}
	})
}