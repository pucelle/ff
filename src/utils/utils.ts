/** Type guard that removes undefined entries from generated arrays. */
export function defined<T>(value: T | undefined): value is T {
	return value !== undefined
}
