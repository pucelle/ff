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
		print(err?.stack ?? msg)
	}

	window.addEventListener('unhandledrejection', e => {
		print(e.reason?.stack ?? e.reason?.message ?? String(e.reason))
	})
}


function print(message: any) {
	document.body.insertAdjacentHTML(
		'beforeend',
		`
			<div style="position:fixed; top:0; left:0; max-width:100vh; max-height:100vh; padding: 12px; z-index:10000; overflow:auto; background: #888; ">
				${message}
			</div>
		`
	)
}


