/** Read clipboard event data. */
export async function readClipboardEventData(e: ClipboardEvent): Promise<Record<string, string> | null> {
	let data: Record<string, string> | null = null

	if (e.clipboardData) {
		data = {}

		for (let item of e.clipboardData.items) {
			if (item.kind === 'string') {
				data[item.type] = await new Promise(resolve => item.getAsString(resolve))
			}
		}
	}

	return data	
}


/** Set clipboard event data. */
export function writeClipboardEventData(e: ClipboardEvent, data: Record<string, string>) {
	for (let [key, value] of Object.entries(data)) {
		e.clipboardData?.setData(key, value)
	}
}


/** Try to write data to clopboard. */
export async function readClipboardData(): Promise<Record<string, string> | null> {
	try {
		await requestClipboardPermission('read')

		let dataTransfer = await navigator.clipboard.read() as unknown as DataTransfer
		let data: Record<string, string> = {}

		if (dataTransfer) {
			for (let item of dataTransfer.items) {
				if (item.kind === 'string') {
					data[item.type] = await new Promise(resolve => item.getAsString(resolve))
				}
			}
		}

		return data
	}
	catch (err) {
		return null
	}
}


/** Try to read data from clipboard. */
export async function writeClipboardData(data: Record<string, string>): Promise<boolean> {
	try {
		await requestClipboardPermission('write')

		let dataTransfer = new DataTransfer()
		for (let [key, value] of Object.entries(data)) {
			dataTransfer.setData(key, value)
		}

		await navigator.clipboard.write(dataTransfer as any)

		return true
	}
	catch (err) {
		return false
	}
}


/** Request clipboard permission. */
async function requestClipboardPermission(name: 'read' | 'write') {
	let result = await navigator.permissions.query({name: 'clipboard-' + name as any})
	if (result.state == 'granted' || result.state == 'prompt') {
		return
	}
	else {
		throw new Error(result.state)
	}
}