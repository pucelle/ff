/** Type guard that removes null or undefined entries from generated arrays. */
export function defined<T>(value: T | null | undefined): value is T {
	return value !== undefined
		&& value !== null
}
