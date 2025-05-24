/** Convert a string to a regexp source. */
export function escape(string: string): string {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}