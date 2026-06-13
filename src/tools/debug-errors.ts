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
		let message = String(msg).trim()
		let stack = err?.stack ?? ''

		print(message + (stack ? '\n' + stack : ''))
	}

	window.addEventListener('unhandledrejection', err => {
		let message = err.reason?.message ?? String(err.reason) ?? ''
		let stack = err.reason?.stack ?? ''

		print(message + (stack ? '\n' + stack : ''))
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
