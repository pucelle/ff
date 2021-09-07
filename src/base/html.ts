
/**
 * Encode `<>` to `&...` to makesure HTML codes are safely to be appended into document.
 * @param code Text to be encoded.
 */
export function encodeHTML(code: string): string {
	return code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}


/**
 * Decode HTML codes which includes `&...` to be readable characters.
 * Otherwise it will remove all the html tags.
 * @param code Encoded HTML codes.
 */
export function decodeHTML(code: string): string {
	let parser = new DOMParser()
	let dom = parser.parseFromString(`<!DOCTYPE html><body>${code}</body></html>`, 'text/html')
	return dom.body.textContent!
}