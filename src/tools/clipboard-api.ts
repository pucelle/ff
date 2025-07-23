import {promiseWithResolves} from '@pucelle/lupos'
import {logger} from './logger'
import {biggerStorage} from './storage'


/** Reference to `https://github.com/w3c/editing/blob/gh-pages/docs/clipboard-pickling/explainer.md`. */


/** Read clipboard event data as an data object, can limit type. */
export async function readFromEvent(e: ClipboardEvent, limitType: 'text' | 'file' | 'all' = 'text'): Promise<Record<string, string | File> | null> {
	let data: Record<string, string | File> | null = null

	if (e.clipboardData) {
		data = {}

		for (let item of e.clipboardData.items) {
			if (item.kind === 'string') {
				if (limitType === 'text' || limitType === 'all') {
					data[item.type] = await new Promise(resolve => item.getAsString(resolve))
				}
			}
			else if (item.kind === 'file') {
				if (limitType === 'file' || limitType === 'all') {
					data[item.type] = item.getAsFile()!
				}
			}
		}
	}

	return data	
}

/** Set clipboard event data from an data object, limit string type. */
export function writeToEvent(e: ClipboardEvent, data: Record<string, string>) {
	for (let [key, value] of Object.entries(data)) {
		e.clipboardData?.setData(key, value)
	}
}

/** Try reading system clipboard data, can limit type. */
export async function read(limitType: 'text' | 'file' | 'all' = 'text'): Promise<Record<string, string | Blob> | null> {
	await requestPermission('read')

	let clipboardItems = await navigator.clipboard.read()
	let data: Record<string, string | Blob> = {}

	if (!clipboardItems || clipboardItems.length === 0) {
		return data
	}

	for (let item of clipboardItems) {
		for (let type of item.types) {
			if (type.startsWith('text/')) {
				if (limitType === 'text' || limitType === 'all') {
					data[type] = await readBlobAsText(await item.getType(type))
				}
			}
			else {
				if (limitType === 'file' || limitType === 'all') {
					data[type] = await item.getType(type)
				}
			}
		}
	}

	return data
}


/** Read blob as string. */
function readBlobAsText(blob: Blob): Promise<string> {
	let {promise, resolve, reject} = promiseWithResolves<string>()
	let reader = new FileReader()

	reader.onload = function() {
		resolve(reader.result as string)
	}

	reader.onerror = function(err) {
		reject(err)
	}

	reader.readAsText(blob)

	return promise
}


/** 
 * Try writing to system clipboard data, limit string type.
 * Note for your customized format, should use format type starts with `web `,
 * like `web text/custom`, `web text/customType`.
 * If `canDropWebCustomData` is specified as `true`, will drop web custom data and write again if failed.
 */
export async function write(data: Record<string, string | Blob>, canDropWebCustomData: boolean = false): Promise<void> {
	await requestPermission('write')
	let blobData = dataToBlobData(data)

	try {
		await navigator.clipboard.write([new ClipboardItem(blobData)])
	}
	catch (err) {

		// Can drop some custom data items.
		if (canDropWebCustomData && Object.keys(blobData).find(key => key.startsWith('web '))) {
			blobData = Object.fromEntries(Object.entries(blobData).filter(([key]) => !key.startsWith('web ')))

			if (Object.keys(blobData).length > 0) {
				await navigator.clipboard.write([new ClipboardItem(blobData)])
			}
			else {
				throw err
			}
		}
		else {
			throw err
		}
	}
}


/** 
 * Request clipboard read / write permission,
 * browser must get focus recently.
 * On Safari, URL must be https type, and must request in an event loop.
 */
async function requestPermission(name: 'read' | 'write') {
	let queryName: any = name === 'read' ? 'clipboard-read' : 'clipboard-write'
	let result = await navigator.permissions.query({name: queryName})
	if (result.state == 'granted' || result.state == 'prompt') {
		return
	}
	else {
		throw new Error(result.state)
	}
}


/** Convert all string type of data item to blob. */
function dataToBlobData(data: Record<string, string | Blob>): Record<string, Blob> {
	let blobData: Record<string, Blob> = {}

	for (let [key, value] of Object.entries(data)) {
		if (typeof value === 'string') {
			value = new Blob([value], {type: key})
		}
		blobData[key] = value
	}

	return blobData
}


	
/** 
 * When your app contains a copy & paste action buttons,
 * and system clipboard may be not fully available,
 * You may need an alternative way, and here provides.
 * 
 * This class can detect whether system clipboard data is available,
 * and use clipboard event or storage cache if system clipboard is not available.
 * 
 * Note one this type of store can only process one single type of clipboard data.
 */
export class MixedClipboardStore<D extends Record<string, string> = any> {

	/** Unique name. */
	private name: string

	constructor(name: string) {
		this.name = name
	}

	/** Write clipboard data to mixed store, and may write to a clipboard event if it exists. */
	async write(data: D, e?: ClipboardEvent) {
		if (e) {
			writeToEvent(e, data)
			e.preventDefault()
		}

		try {
			await write(data)
		}
		catch (err) {
			logger.warn(err)
		}

		// Also write to storage, cache it for at most 7 days.
		biggerStorage.set('flit-clipboard', data, '7d')
	}

	/** Read clipboard data from mixed store, and may read from a clipboard event if it exists. */
	async read(limitType: 'text' | 'file' | 'all' = 'text', e?: ClipboardEvent): Promise<D | null> {
		let data: D | null = null

		try{
			let nvData = await read(limitType) as D | null
			if (nvData) {
				data = nvData
			}
		}
		catch (err) {
			logger.warn(err)
		}

		if (e) {
			let evData = await readFromEvent(e, limitType) as D | null
			if (evData) {
				data = {...(data || {}), ...evData}
			}
		}

		// May only write text/plane successfully.
		// Here we read out storage data, and compare text/plain part.
		let stData = await biggerStorage.get('flit-clipboard-' + this.name)
		if (stData && (!data || !data['text/plain'] || data['text/plain'] === stData['text/plain'])) {

			// Only add not existing, not overwrite.
			data = {...stData, ...(data || {})}
		}

		return data
	}
}