
/**
 * Encode `<>` to `&...`
 * @param text Text to be encoded.
 */
export function encodeHTML(text: string): string {
	return text.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}


/**
 * Decode HTML codes which includes `&...` to mapped characters.
 * @param html Encoded HTML codes.
 */
export function decodeHTML(html: string): string {
	let parser = new DOMParser()
	let dom = parser.parseFromString(`<!DOCTYPE html><body>${html}</body></html>`, 'text/html')
	return dom.body.textContent!
}