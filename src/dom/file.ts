/**
 * Download url as a file with specified `fileName`.
 * Not that `fileName` may not working for cross domain resources.
 * The final behavior depends on browser.
 * @param url The URL to download.
 * @param fileName The file name.
 */
export function downloadURL(url: string, fileName: string) {
	let a = document.createElement('a')
	a.hidden = true
	a.href = url

	if (fileName) {
		a.download = fileName
	}

	document.body.appendChild(a)
	a.click()
	a.remove()
}


/**
 * Download string as a file with specified `fileName`.
 * @param fileName The file name.
 * @param text The text to download.
 * @param mime The MIME type of file.
 */
export function downloadText(fileName: string, text: string, type: string = 'text/plain') {
	let blob = new Blob([text], {type})
	let fs = new FileReader

	fs.onload = () => {
		fs.onload = null

		let a = document.createElement('a')
		a.download = fileName
		a.href = fs.result as string
		document.body.append(a)
		a.click()
		a.remove()
	}

	fs.readAsDataURL(blob)
}


/**
 * Select single file match MIME type by `<input type="file">`.
 * @param The MIME type of files.
 */
export function selectFile(mime: string): Promise<File | null> {
	return selectFileOrFolder(mime, false, false) as Promise<File | null>
}


/**
 * Select multiple files match MIME type by `<input type="file" multiple">`.
 * @param The MIME type of files.
 */
export function selectMultipleFile(mime: string): Promise<File[] | null> {
	return selectFileOrFolder(mime, false, true) as Promise<File[] | null>
}


/**
 * Select single folder by `<input type="file"directory>`.
 */
export function selectFolder(): Promise<File | null> {
	return selectFileOrFolder("*", true, false) as Promise<File | null>
}


/**
 * Select multiple folder by `<input type="file" directory multiple>`.
 */
export function selectMultipleFolder(): Promise<File[] | null> {
	return selectFileOrFolder("*", true, true) as Promise<File[] | null>
}


function selectFileOrFolder(mime: string, isFolder: boolean, isMultiple: boolean): Promise<File[] | File | null> {
	return new Promise((resolve) => {
		let input = document.createElement('input')
		input.type = 'file'
		input.hidden = true
		input.accept = mime
		input.multiple = isMultiple

		if (isFolder) {
			input.setAttribute('directory', '')
			input.setAttribute('webkitdirectory', '')
		}
		
		input.onchange = () => {
			if (input.files) {
				resolve(isMultiple ? [...input.files] : input.files[0] || null)
			}
			else {
				resolve(null)
			}
		}

		function onDomFocus() {
			document.removeEventListener('focus', onDomFocus, false)
			input.onchange = null
			input.remove()
		}

		document.addEventListener('focus', onDomFocus, false)
		document.body.appendChild(input)

		input.click()
	})
}


/**
 * Get files in DataTransfer object captured from drop event.
 * Only work on Chrome.
 * @param transfer The ` DataTransfer` object from drop event.
 */
export async function getFilesFromTransfer(transfer: DataTransfer): Promise<File[]> {
	let transferFiles = [...transfer.files]
	let files: File[] = []

	if (transfer.items && typeof DataTransferItem === 'function' && (DataTransferItem.prototype.hasOwnProperty('getAsEntry') || DataTransferItem.prototype.webkitGetAsEntry)) {
		let items = [...transfer.items].filter(item => item.kind === 'file')

		try{
			for (let item of items) {
				let entry = item.hasOwnProperty('getAsEntry') ? (item as any).getAsEntry() : item.webkitGetAsEntry()
				files.push(...await readFilesFromEntry(entry))
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


async function readFilesFromEntry(entry: any): Promise<File[]> {
	let files: File[] = []

	return new Promise(async (resolve, reject) => {
		if (!entry) {
			resolve()
		}
		else if (entry.isFile) {
			entry.file((file: any) => {
				file.path = file.path || entry.fullPath
				files.push(file)
				resolve(files)
			}, reject)
		}
		else if (entry.isDirectory) {
			let reader = entry.createReader()

			try{
				while (true) {
					let filesInFolder = await readFilesFromDirectoryReader(reader)
					files.push(...filesInFolder)
					if (!filesInFolder.length) {
						break
					}
				}
			}
			catch (err) {
				reject(err)
			}

			resolve(files)
		}
	})
}


function readFilesFromDirectoryReader(reader: any): Promise<File[]> {
	return new Promise((resolve, reject) => {
		let files: File[] = []

		// readEntries API can only read at most 100 files each time, so if reader isn't completed, still read it.
		reader.readEntries(
			async (entries: any) => {
				if (entries && entries.length) {
					try{
						for (let entry of entries) {
							files.push(...await readFilesFromEntry(entry))
						}
					}
					catch (err) {
						reject(err)
					}

					resolve(files)
				}
				else {
					resolve(files)
				}
			},
			reject
		)
	})
}