const PrefixedUIDMap: Map<string, number> = new Map()
let currentIUID = 0


/** Create an auto increasement web-document-unique int type id. */
export function intUid(): number {
	return ++currentIUID
}


/** Create a web-document-unique string type id, 12 chars long by default, 36 chars long at max. */
export function shortUid(length: number = 12): string {
	return guid().slice(-length)
}


/** Create a global-unique id, 36 chars long. */
export function guid(): string {
	return crypto.randomUUID?.()

	// Reference from https://stackoverflow.com/a/2117523/2800218
	|| '10000000-1000-4000-8000-100000000000'.replace(
		/[018]/g,
		function(c: string) {
			let n = Number(c)
			return (n ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> n / 4).toString(16)
		}
	)
}


/** Create a prefixed unique id, in `prefix-xxx` format. */
export function prefixedUid(prefix: string): string {
	let newId = (PrefixedUIDMap.get(prefix) || 0) + 1
	PrefixedUIDMap.set(prefix, newId)

	return prefix + '-' + newId
}


/** Whether an id having specified prefix. */
export function isUidInPrefix(id: string, prefix: string): boolean {
	return id.startsWith(prefix + '-')
}
