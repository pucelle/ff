
import {useQuery} from './url-utils'


/** Upload file with progress. */
export function uploadFileWithProgress(
	url: string,
	query: Record<string, string | number> | null,
	file: File,
	onProgress?: (loaded: number, total: number) => void
) {
	if (query) {
		url = useQuery(url, query)
	}

	return new Promise((resolve, reject) => {
		let xhr = new XMLHttpRequest()
		xhr.open('POST', url)

		xhr.upload.onprogress = e => {
			if (e.lengthComputable) {
				onProgress?.(e.loaded, e.total)
			}
		}

		xhr.onload = () => {
			if (typeof xhr.response === 'string') {
				resolve(JSON.parse(xhr.response))
			}
			else if (typeof xhr.response === 'object') {
				resolve(xhr.response)
			}
			else {
				resolve(null)
			}
		}

		xhr.onerror = reject
		xhr.send(file)
	})
}