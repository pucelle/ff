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
	return (crypto as any).randomUUID()
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
