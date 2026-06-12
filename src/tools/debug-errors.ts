/** 
 * Debug errors by appending error message into body.
 * Especially on phone or pad.
 */
export function debug_errors() {

	// Avoid error when doing SSR.
	if (typeof window === 'undefined') {
		return
	}

	window.onerror = (msg, _src, _line, _col, err) => {
		print(String(msg).trim() + '\n' + err?.stack)
	}

	window.addEventListener('unhandledrejection', e => {
		print((e.reason?.message ?? String(e.reason) ?? '').trim() + '\n' + e.reason?.stack)
	})
}


function print(message: any) {
	document.body.insertAdjacentHTML(
		'beforeend',
		`
			<pre style="position:fixed; top:0; left:0; max-width:100vw; max-height:100vh; word-break: break-all; padding: 12px; font-size: 9px; z-index:10000; overflow: auto; background: #888; ">
				${message}
			</pre>
		`
	)
}
