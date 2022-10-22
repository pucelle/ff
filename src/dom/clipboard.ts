/** Copy datas into clipboard. */
export async function setClipboardData(data: Record<string, string>): Promise<boolean> {
	let input = document.createElement('textarea')
	let pasteText = data['text/plain'] || ' '
	
	input.value = pasteText
	input.style.position = 'absolute'
	input.style.width = '0'
	input.style.height = '0'
	document.body.appendChild(input)
	input.select()

	let promise = setClipboardDataAtCopyEvent(data)
	let success = document.execCommand('copy')
	success = success && await promise
	input.remove()

	return success
}


function setClipboardDataAtCopyEvent(data: Record<string, string>): Promise<boolean> {
	return new Promise(resolve => {
		let keys = Object.keys(data)
		let hasNonTextPlainKeys = keys.some(key => key !== 'text/plain')
	
		if (hasNonTextPlainKeys) {

			// Handle Copy event.
			let handle = (e: ClipboardEvent) => {
				for (let [key, value] of Object.entries(data)) {
					e.clipboardData?.setData(key, value)
				}
				e.preventDefault()
				end()
				resolve(true)
			}

			// End processing.
			let end = () => {
				document.removeEventListener('copy', handle, false)
				clearTimeout(timeoutId)
			}
	
			document.addEventListener('copy', handle, false)

			// Wait for at most 500ms, send fail if not trigger.
			let timeoutId = setTimeout(() => {
				end()
				resolve(false)
			}, 500)
		}
	})
}


/** Read datas from clipboard. */
 export async function getClipboardData(): Promise<Record<string, string> | null> {
	let input = document.createElement('textarea')
	input.style.position = 'absolute'
	input.style.width = '0'
	input.style.height = '0'
	document.body.appendChild(input)
	input.focus()

	let promise = getClipboardDataAtCopyEvent()
	let success = document.execCommand('paste')
	let data = await promise
	input.remove()

	return success ? data : null
}


function getClipboardDataAtCopyEvent(): Promise<Record<string, string> | null> {
	return new Promise(resolve => {

		// Handle Paste event.
		let handle = async (e: ClipboardEvent) => {
			let data: Record<string, string> | null = null

			if (e.clipboardData) {
				data = {}

				for (let item of e.clipboardData.items) {
					if (item.kind === 'string') {
						data[item.type] = await new Promise(resolve => item.getAsString(resolve))
					}
				}
			}

			e.preventDefault()
			end()
			resolve(data)
		}

		// End processing.
		let end = () => {
			document.removeEventListener('paste', handle, false)
			clearTimeout(timeoutId)
		}

		document.addEventListener('paste', handle, false)

		// Wait for at most 500ms, send fail if not trigger.
		let timeoutId = setTimeout(() => {
			end()
			resolve(null)
		}, 500)
	})
}
