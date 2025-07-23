/** HTML Encoding Characters map. */
const HTMLEncodingMap: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;',
}

/** HTML Decoding Characters map. */
const DynamicHTMLDecodingMap: Record<string, string>
	= /*#__PURE__*/Object.fromEntries(
		/*#__PURE__*/Object.entries(HTMLEncodingMap).map(v => [v[1], v[0]])
	)


/** 
 * Encode characters like `<>&"'` to `&...;`
 * to make HTML codes are safely to be appended into document as text content.
 */
export function encodeToHTML(code: string): string {
	return code.replace(/[&<>"']/g, (a) => {
		return HTMLEncodingMap[a]
	})
}

/** 
 * Decode all HTML encoded characters like `$apos;`, `$xabcd;`, `$#1234;` to decoded characters.
 * Can only work in Browser Environment.
 */
export function decodeFromHTML(code: string): string {
	return code.replace(/^#x([\da-fA-F]+)$/g, function(_m0, m1) {
		return String.fromCharCode(parseInt(m1, 16))
	})
	.replace(/^#(\d+)$/g, function(_m0, m1) {

		// `~~` equals 32 bit parseInt.
		return String.fromCharCode(~~m1)
	})
	.replace(/&\w+;/g, function(m0) {
		return decodeEntity(m0)
	})
}

/** Check what a HTML encoded characters like `&amp;` should be decoded. */
function decodeEntity(entity: string) {
	if (DynamicHTMLDecodingMap[entity]) {
		return DynamicHTMLDecodingMap[entity]
	}

	let span = document.createElement('span')
	span.textContent = entity
	let decoded = span.textContent

	if (decoded.length === 1) {
		DynamicHTMLDecodingMap[entity] = decoded
	}

	return decoded
}



/** 
 * Convert text to HTML codes.
 * Each line will be wrapped with `<p>...</p>`.
 */
export function textToHTML(text: string): string {
	return encodeToHTML(text)
		.split('\n')
		.map(line => `<p>${line}</p>`)
		.join('')
}

/** 
 * Convert HTML codes to text by removing all html tags,
 * and decode all html encoding characters.
 * Also removes useless `<br>`.
 */
export function htmlToText(html: string): string {
	html = html.replace(/<br ?\/?>(<\/(?:p|div))>/gi, '$1')
		.replace(/<\/p>\s*?<p.*?>|<br ?\/?>/gi, '\n')
		.replace(/<[\s\S]*?>/g, '')

	return decodeFromHTML(html)
}



/** Clean all unsafe html tags and events, like `<script>`, `onerror=...` */
export function cleanUnsafeHTML(html: string): string {
	return html.replace(/<script[\s\S]*?>[\s\S]*?<\/script\s*>/gi, '')
	.replace(/<\w+[\s\S]*?>/g, function(m0: string) {
		return m0.replace(/\s*on\w+\s*=\s*(['"])?.*?\1/g, '')
	})
}

