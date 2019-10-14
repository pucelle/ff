
/**
 * Encode `<>` to `&...` to makesure HTML codes safe to append into document.
 * @param code Text to be encoded.
 */
export function encodeHTML(code: string): string {
	return code.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}


/**
 * Decode HTML codes which includes `&...` to mapped readable characters.
 * @param code Encoded HTML codes.
 */
export function decodeHTML(code: string): string {
	let parser = new DOMParser()
	let dom = parser.parseFromString(`<!DOCTYPE html><body>${code}</body></html>`, 'text/html')
	return dom.body.textContent!
}