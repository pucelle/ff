/** Covert data type to DB storage row type. */
export type RowOf<T extends object> = {
	[K in keyof T]: ColOf<T[K]>
}

type ColOf<T> =
	T extends null | undefined
		? T
		: T extends object
			? string
			: T


/** Convert storage row to raw data format. */
export function from<T extends Record<string, unknown>>(
	row: RowOf<T> | null,
	jsonFields: readonly (keyof T)[]
): T | null {
	if (!row) {
		return null
	}

	let result = {...row} as Record<keyof T, unknown>

	for (let field of jsonFields) {
		let value = result[field]

		if (typeof value === 'string') {
			result[field] = JSON.parse(value)
		}
	}

	return result as T
}


/** Convert data item to a db storage format. */
export function to<T extends Record<string, unknown>>(data: T): RowOf<T> {
	let result: Record<string, unknown> = {}

	for (let [key, value] of Object.entries(data)) {
		result[key] = value !== null && typeof value === 'object'
			? JSON.stringify(value)
			: value
	}

	return result as RowOf<T>
}