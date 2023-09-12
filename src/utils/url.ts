export namespace URLUtils {

	/** Parse `url` search part to get a query parameter object. */
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


	/** Combine base `url` and `params` object to a new URL. */
	export function useQuery(url: string, params: Record<string, string>): string {
		let hasQuery = url.includes('?')

		if (typeof params === 'string') {
			return url + (hasQuery ? '&' : '?') + params
		}
		else if (params && typeof params === 'object') {
			for (let key in params) {
				let value = encodeURIComponent(params[key])
				url += (hasQuery ? '&' : '?') + key + '=' + value
				hasQuery = true 
			}
		}

		return url
	}
}