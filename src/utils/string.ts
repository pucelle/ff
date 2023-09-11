export namespace StringUtils {

	/**
	 * Format string to replace placeholders like `{key}` in `template` to `args[key]`.
	 * Will keep the placeholder when no match found.
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



	/** Encode `<>` to `&...` to makesure HTML codes are safely to be appended into document. */
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
		return string.slice(0, 1).toUpperCase() + string.slice(1).toLowerCase()
	}

	/** Convert `string` to camer case type: `a-bc` -> `Abc`. */
	export function toCamerCase(string: string): string {
		return string.replace(/[-_ ][a-z]/gi, m0 => m0[1].toUpperCase())
	}

	/** Convert `string` to dash case type by joining words with `-`: `a bc` -> `a-bc`. */
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

	/** Convert `string` to dash case by joining words with `_`: `a bc` -> `a_bc`. */
	export function toUnderscoreCase(string: string): string {
		return toDashCase(string).replace(/-/g, '_')
	}


	
	/** Parse `url` search part to a query parameter object. */
	export function parseQuery(url: string): Record<string, string> {
		let match = url.match(/\?(.+)/)
		let pieces = match ? match[1].split('&') : []
		let query: Record<string, string> = {}

		for (let piece of pieces) {
			let [key, value] = piece.split('=')
			if (key) {
				value = decodeURIComponent(value || '')
				query[key] = value
			}
		}

		return query
	}


	/** Combine base `url` and `query` parameters to a new URL. */
	export function useQuery(url: string, query: Record<string, string>): string {
		let hasQuery = url.includes('?')

		if (typeof query === 'string') {
			return url + (hasQuery ? '&' : '?') + query
		}
		else if (query && typeof query === 'object') {
			for (let key in query) {
				let value = encodeURIComponent(query[key])
				url += (hasQuery ? '&' : '?') + key + '=' + value
				hasQuery = true 
			}
		}

		return url
	}
}