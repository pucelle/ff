/**
 * Parse `url` search part to a query parameter object.
 * @param url The url to parse query parameters.
 */
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


/**
 * Combine base `url` and `query` parameters to a new URL.
 * @param url The base url.
 * @param query The query parameter object.
 */
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