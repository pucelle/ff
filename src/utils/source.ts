import {TimeUtils} from "./time"

export namespace SourceUtils {

	/** Load image as an `<image>` element. */
	export async function loadImage(url: string) {
		return new Promise((resolve, reject) => {
			let image = new Image()

			image.onload = () => {
				resolve(image)
			}

			image.onerror = (err) => {
				reject(err)
			}

			image.src = url
			image.crossOrigin = 'anonymous'
		}) as Promise<HTMLImageElement>
	}

	/** Load resource from URL as a Blob object. */
	export async function loadAsBlob(url: string): Promise<Blob> {
		return (await fetch(url, {mode: 'cors'})).blob()
	}

	/** Load resource from URL as a DataURI. */
	export async function loadAsDataURI(url: string): Promise<string> {
		let blob = await loadAsBlob(url)
		let reader = new FileReader()

		let promise =  new Promise((resolve, reject) => {
			reader.onload = () => {
				resolve(reader.result as string)
			}

			reader.onerror = () => {
				reject()
			}
		}) as Promise<string>

		reader.readAsDataURL(blob)

		return promise
	}



	/** 
	 * Download blob as a file and with specified `fileName`.
	 * Not that `fileName` may not work for crossed domain resources in some browsers.
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
		setTimeout(() => {
			URL.revokeObjectURL(url)
		}, 60000)
	}

	/**
	 * Download url as a file and with specified `fileName`.
	 * Not that `fileName` may not work for crossed domain resources in some browsers.
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
	 * Download string as a file with specified `fileName`.
	 * Not that `fileName` may not work for crossed domain resources in some browsers.
	 */
	export function downloadText(text: string, type: string = 'text/plain', fileName: string = '') {
		let blob = new Blob([text], {type})
		downloadBlob(blob, fileName)
	}



	/** Select a single file that matches `MIME` type, equals clicking a `<input type="file">`. */
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
		return new Promise((resolve) => {
			let input = document.createElement('input')
			input.type = 'file'
			input.accept = mime
			input.multiple = isMultiple
			input.hidden = true

			if (isFolder) {
				input.setAttribute('directory', '')
				input.setAttribute('webkitdirectory', '')
			}
			
			input.onchange = () => {
				resolve(input.files || null)
			}

			async function onDocumentFocus() {
				await TimeUtils.sleep(1000)
				document.removeEventListener('focus', onDocumentFocus, false)
				input.onchange = null
				input.remove()
			}

			document.addEventListener('focus', onDocumentFocus, false)
			document.body.appendChild(input)

			input.click()
		})
	}


	/**
	 * Get all the files from a `DataTransfer` object that captured from drop event.
	 * Only work on modern browsers.
	 */
	export async function *walkFilesInTransfer(transfer: DataTransfer): AsyncGenerator<File> {
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
					yield *walkFilesInEntry(entry)
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
	export async function *walkFilesInEntry(entry: FileSystemEntry): AsyncGenerator<File> {
		if (!entry) {
			return
		}

		if (entry.isFile) {
			yield await new Promise((resolve, reject) => {
				(entry as FileSystemFileEntry).file((file: File) => {
					resolve(file)
				}, reject)
			})
		}
		else if (entry.isDirectory) {
			yield *walkFilesInDirectoryEntry(entry as FileSystemDirectoryEntry)
		}
	}

	/** Read files from a directory reader. */
	async function *walkFilesInDirectoryEntry(entry: FileSystemDirectoryEntry): AsyncGenerator<File> {
		let reader = entry.createReader()

		while (true) {
			let entries = await new Promise((resolve, reject) => {
				reader.readEntries(
					(entries: FileSystemEntry[]) => {
						resolve(entries)
					},
					reject
				)
			}) as FileSystemEntry[]

			// readEntries API can only read at most 100 files each time, so if reader isn't completed, still read it.
			if (entries.length === 0) {
				break
			}

			for (let entry of entries) {
				yield *walkFilesInEntry(entry)
			}
		}
	}
}