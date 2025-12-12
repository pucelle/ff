const PrefixedUIDMap: Map<string, number> = /*#__PURE__*/new Map()
let currentIntUID = 0


/** Create an auto increasement web-document-unique int type id. */
export function intUid(): number {
	return ++currentIntUID
}


/** Create a random hex of specified length. */
export function randomHex(byteLength: number = 16): Uint8Array {
	let arr = new Uint8Array(byteLength)
	return crypto.getRandomValues(arr)
}


/** Create a random hex string, with specified length * 2. */
export function randomHexString(byteLength: number = 16): string {
	let hex = randomHex(byteLength)
	return [...hex].map(b => b.toString(16).padStart(2, '0')).join('')
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
