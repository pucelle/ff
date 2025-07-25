import {sleep} from './function'
import {promiseWithResolves} from '@pucelle/lupos'


/** Load image source and output an `<image>` element. */
export async function loadImage(url: string) {
	let {promise, resolve, reject} = promiseWithResolves<HTMLImageElement>()
	let image = new Image()

	image.onload = function() {
		resolve(image)
	}

	image.onerror = function(err) {
		reject(err)
	}

	image.src = url
	image.crossOrigin = 'anonymous'

	return promise
}

/** Load resource by an URL and output a Blob object. */
export async function loadAsBlob(url: string): Promise<Blob> {
	return (await fetch(url, {mode: 'cors'})).blob()
}

/** Load resource by an URL and output a DataURI. */
export async function loadAsDataURI(url: string): Promise<string> {
	let blob = await loadAsBlob(url)
	let reader = new FileReader()
	let {promise, resolve, reject} = promiseWithResolves<string>()

	reader.onload = function() {
		resolve(reader.result as string)
	}

	reader.onerror = function(err) {
		reject(err)
	}

	reader.readAsDataURL(blob)

	return promise
}



/** 
 * Download Blob as a file with specified `fileName`.
 * Not that `fileName` may not work for cross-domain resources.
 */
export function downloadBlob(blob: Blob, fileName: string = '') {
	let url = URL.createObjectURL(blob)
	let a = document.createElement('a')

	a.href = url
	a.download = fileName
	a.hidden = true
	document.body.appendChild(a)
	a.click()
	a.remove()

	// One minute should be enough to download completely.
	setTimeout(function() {
		URL.revokeObjectURL(url)
	}, 60000)
}

/**
 * Download url as a file and with specified `fileName`.
 * Not that `fileName` may not work for cross-domain resources.
 */
export function downloadURL(url: string, fileName: string = '') {
	let a = document.createElement('a')

	a.href = url
	a.download = fileName
	a.hidden = true
	document.body.appendChild(a)
	a.click()
	a.remove()
}

/**
 * Download text as a file with specified `fileName`.
 * Not that `fileName` may not work for cross-domain resources.
 */
export function downloadText(text: string, type: string = 'text/plain', fileName: string = '') {
	let blob = new Blob([text], {type})
	downloadBlob(blob, fileName)
}



/** Select a single file matches `MIME` type, equals clicking a `<input type="file">`. */
export function selectFile(mime: string): Promise<File | null> {
	return selectFileOrFolder(mime, false, false) as Promise<File | null>
}

/** Select multiple files match `MIME` type, equals clicking a `<input type="file" multiple>`. */
export function selectMultipleFiles(mime: string): Promise<FileList | null> {
	return selectFileOrFolder(mime, false, true) as Promise<FileList | null>
}

/** Select a single folder, equals clicking a `<input type="file" directory>`. */
export function selectFolder(): Promise<File | null> {
	return selectFileOrFolder("*", true, false) as Promise<File | null>
}

/** Select multiple folders, equals clicking a `<input type="file" directory multiple>`. */
export function selectMultipleFolders(): Promise<FileList | null> {
	return selectFileOrFolder("*", true, true) as Promise<FileList | null>
}

/** Select file or folder, multiple or not. */
function selectFileOrFolder(mime: string, isFolder: boolean, isMultiple: boolean): Promise<FileList | null> {
	let {promise, resolve} = promiseWithResolves<FileList | null>()
	let input = document.createElement('input')
	input.type = 'file'
	input.accept = mime
	input.multiple = isMultiple
	input.hidden = true

	if (isFolder) {
		input.setAttribute('directory', '')
		input.setAttribute('webkitdirectory', '')
	}
	
	input.onchange = function() {
		resolve(input.files || null)
	}

	async function onDocumentFocus() {
		await sleep(1000)
		document.removeEventListener('focus', onDocumentFocus, false)
		input.onchange = null
		input.remove()
	}

	document.addEventListener('focus', onDocumentFocus, false)
	document.body.appendChild(input)

	input.click()
	
	return promise
}


/**
 * Get all the files from a `DataTransfer` object that captured from drop event.
 * Only work on modern browsers.
 */
export async function* walkFilesInTransfer(transfer: DataTransfer): AsyncGenerator<File> {
	let transferFiles = [...transfer.files]
	let files: File[] = []

	if (transfer.items
		&& typeof DataTransferItem === 'function'
		&& (DataTransferItem.prototype.hasOwnProperty('getAsEntry')
			|| DataTransferItem.prototype.hasOwnProperty('webkitGetAsEntry')
		)
	) {
		let items = [...transfer.items].filter(item => item.kind === 'file')

		try{
			for (let item of items) {
				let entry = item.hasOwnProperty('getAsEntry') ? (item as any).getAsEntry() : item.webkitGetAsEntry()
				yield* walkFilesInEntry(entry)
			}
		}
		catch (err) {
			files = transferFiles
		}
	}

	// Can only read files
	else {
		files = transferFiles
	}

	return files
}

/** Read files from a file entry. */
export async function* walkFilesInEntry(entry: FileSystemEntry): AsyncGenerator<File> {
	if (!entry) {
		return
	}

	if (entry.isFile) {
		let {promise, resolve, reject} = promiseWithResolves<File>();

		(entry as FileSystemFileEntry).file(function(file: File) {
			resolve(file)
		}, reject)

		yield await promise
	}
	else if (entry.isDirectory) {
		yield* walkFilesInDirectoryEntry(entry as FileSystemDirectoryEntry)
	}
}

/** Read files from a directory reader. */
async function* walkFilesInDirectoryEntry(entry: FileSystemDirectoryEntry): AsyncGenerator<File> {
	let reader = entry.createReader()

	while (true) {
		let {promise, resolve, reject} = promiseWithResolves<FileSystemEntry[]>()

		reader.readEntries(
			function(entries: FileSystemEntry[]) {
				resolve(entries)
			},
			reject
		)
	
		let entries = await promise

		// readEntries API can only read at most 100 files each time, so if reader isn't completed, still read it.
		if (entries.length === 0) {
			break
		}

		for (let entry of entries) {
			yield* walkFilesInEntry(entry)
		}
	}
}
