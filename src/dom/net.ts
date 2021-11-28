import {EventEmitter} from '@pucelle/event-emitter'


/** Can loaded resource types. */
type RequestType = 'css' | 'js' | 'blob' | 'json' | 'text' | 'buffer' | 'image' | 'audio' | 'video'

/** Response type from request type. */
type ResponseType<T extends RequestType> = ResponseTypes[T]

type ResponseTypes = {
	'css': HTMLLinkElement
	'js': HTMLScriptElement
	'blob': Blob
	'text': string
	'json': any
	'buffer': ArrayBuffer
	'image': HTMLImageElement
	'audio': HTMLAudioElement
	'video': HTMLVideoElement
}

/** Options of resource loader. */
export interface ResourceLoaderOptions {

	/** URL base. */
	base?: string

	/** Hash map for URL map, URL must completely match. */
	revisions?: Record<string, string>
}

/** Events of resource loader. */
export interface ResourceLoaderEvents {

	/** Triggers after loaded all resources. */
	finish: () => void

	/** Triggers after meets error. */
	error: (err: Error) => void

	/** Triggers after loading progress updated. */
	progress: (loaded: number, total: number) => void
}


/**
 * Preload resources from their urls, and get total progress notifications.
 * Please beware of the CORS settings at the server.
 * If you want the progress working, please makesure the `content-length` response header is available.
 */
export class ResourceLoader extends EventEmitter<ResourceLoaderEvents> {

	/** URL base. */
	base: string

	/** Hash map for URL map, URL must completely match. */
	revisions: Record<string, string>

	private loaded: number = 0
	private loadedCount: number = 0
	private totalCount: number = 0

	constructor(options: ResourceLoaderOptions = {}) {
		super()
		this.base = options.base ?? ''
		this.revisions = options.revisions || {}
	
		this.on('finish', () => {
			this.loaded = 0
			this.loadedCount = 0
			this.totalCount = 0
		})
	}

	/** Returns a promise which will be resolved after all loading resources loaded. */
	untilFinish(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.once('finish', resolve)
			this.once('error', reject)
		})
	}

	/** Load one resource. */
	async load<T extends RequestType>(url: string, type?: T): Promise<ResponseType<T>> {
		this.totalCount++
		let lastLoadedRate = 0

		return new Promise(async (resolve, reject) => {
			try {
				let blob = await this.loadResourceBlob(url, (loaded: number, total: number) => {
					let newLoadedRate = loaded / total || 0
					this.loaded += newLoadedRate - lastLoadedRate
					lastLoadedRate = newLoadedRate

					this.emit('progress', Math.min(this.loaded, this.totalCount), this.totalCount)
				})

				let response = blob ? await this.getFromBlob(blob, type || 'blob') : null
				this.loadedCount++

				if (this.loadedCount === this.totalCount) {
					this.emit('progress', this.loadedCount, this.totalCount)
					this.emit('finish')
				}

				resolve(response)
			}
			catch (err) {
				reject(err)
				this.emit('error', err as Error)
			}
		}) as Promise<ResponseType<T>>
	}

	/** Load as text string. */
	async loadText(url: string): Promise<string> {
		return await this.load(url, 'text')
	}

	/** Load as json data. */
	async loadJSON(url: string): Promise<any> {
		return await this.load(url, 'json')
	}

	/** Load as blob. */
	async loadBlob(url: string): Promise<any> {
		return await this.load(url, 'blob')
	}

	/** Load as an array buffer. */
	async loadBuffer(url: string): Promise<ArrayBuffer> {
		return await this.load(url, 'buffer')
	}

	/** Load css source and append into document. */
	async loadCSS(url: string): Promise<HTMLLinkElement> {
		return await this.load(url, 'css')
	}

	/** Load js source and append into document. */
	async loadJS(url: string): Promise<HTMLScriptElement> {
		return await this.load(url, 'js')
	}

	/** Load as an image element. */
	async loadImage(url: string): Promise<HTMLImageElement> {
		return await this.load(url, 'image')
	}

	/** Load as an audio element. */
	async loadAudio(url: string): Promise<HTMLAudioElement> {
		return await this.load(url, 'audio')
	}

	/** Load as an video element. */
	async loadVideo(url: string): Promise<HTMLVideoElement> {
		return await this.load(url, 'video')
	}

	/** Convert relative URL to absolute type. */
	private getAbsoluteURL(url: string): string {
		let hash = this.revisions[url]
		if (hash) {
			url = url.replace(/\.\w+$/, `-${hash}$&`)
		}

		if (/^(?:https?:|\/\/)/.test(url) || !this.base) {
			return url
		}

		return this.base + url
	}

	/** Load one resource. */
	private async loadResourceBlob(url: string, onprogress: (loaded: number, total: number) => void): Promise<Blob | null> {
		let absloteURL = this.getAbsoluteURL(url)

		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest()
			xhr.responseType = 'blob'
			xhr.open('GET', absloteURL)

			xhr.onprogress = (e: ProgressEvent) => {
				if (e.lengthComputable) {
					onprogress(e.loaded, e.total)
				}
			}

			xhr.onloadend = () => {
				if (xhr.status >= 200 && xhr.status < 400) {
					resolve(xhr.response)
				}
				else {
					reject()
				}
			}

			xhr.send()
		})
	}

	/** Handle resource returned blob data. */
	private async getFromBlob(blob: Blob, type: RequestType): Promise<ResponseType<RequestType>> {
		let response: ResponseType<RequestType>

		if (type === 'blob') {
			response = blob
		}
		else if (type === 'css') {
			response = await this.loadStyle(blob)
		}
		else if (type === 'js') {
			response = await this.loadScript(blob)
		}
		else if (type === 'text') {
			response = this.getAsText(blob)
		}
		else if (type === 'json') {
			response = this.getAsJSON(blob)
		}
		else if (type === 'buffer') {
			response = this.getAsBuffer(blob)
		}
		else if (type === 'image') {
			response = this.getAsImage(blob)
		}
		else if (type === 'audio') {
			response = this.getAsAudio(blob)
		}
		else if (type === 'video') {
			response = this.getAsVideo(blob)
		}

		return response
	}

	/** Load style resource as a style tag. */
	private loadStyle(blob: Blob): Promise<HTMLLinkElement> {
		return new Promise((resolve, reject) => {
			let link = document.createElement('link')
			link.rel = 'stylesheet'
			link.href = URL.createObjectURL(blob)
			document.head.append(link)

			link.addEventListener('load', () => resolve(link))
			link.addEventListener('error', () => reject())
		})
	}

	/** Load script resource as a script tag. */
	private loadScript(blob: Blob): Promise<HTMLScriptElement> {
		return new Promise((resolve, reject) => {
			let script = document.createElement('script')
			script.async = false
			script.src = URL.createObjectURL(blob)
			document.head.append(script)
			
			script.addEventListener('load', () => resolve(script))
			script.addEventListener('error', () => reject())
		})
	}
	
	/** Get resource blob as text.*/
	private getAsText(blob: Blob): Promise<string | null> {
		return new Promise(resolve => {
			let reader = new FileReader()
			reader.onload = () => {
				resolve(reader.result as string)
			}
			reader.readAsText(blob)
		})
	}

	/** Get resource blob as JSON. */
	private async getAsJSON(blob: Blob): Promise<any | null> {
		let text = await this.getAsText(blob)
		if (!text) {
			return null
		}

		return JSON.parse(text)
	}

	/** Get resource blob as array buffer. */
	private async getAsBuffer(blob: Blob): Promise<ArrayBuffer | null> {
		return new Promise((resolve, reject) => {
			let reader = new FileReader()

			reader.onload = () => {
				resolve(reader.result as ArrayBuffer)
			}

			reader.onerror = err => {
				reject(err)
			}

			reader.readAsArrayBuffer(blob)
		})
	}

	/** 
	 * Get resource as image.
	 * Never forget to detach blob url of the image after not use it anymore.
	 */
	private async getAsImage(blob: Blob): Promise<HTMLImageElement | null> {
		return new Promise((resolve, reject) => {
			let blobURL = URL.createObjectURL(blob)
			let img = new Image()

			img.src = blobURL
			img.onload = () => resolve(img)
			img.onerror = err => reject(err)
		})
	}

	/**
	 * Get resource blob as audio element.
	 * Never forget to detach blob url of the image after not use it anymore.
	 */
	private async getAsAudio(blob: Blob): Promise<HTMLAudioElement | null> {
		return new Promise((resolve, reject) => {
			let blobURL = URL.createObjectURL(blob)

			let audio = document.createElement('audio')
			audio.preload = 'auto'

			audio.oncanplaythrough = () => {
				resolve(audio)
			}

			audio.onerror = err => {
				reject(err)
			}

			audio.src = blobURL
		})
	}

	/**
	 * Get resource blob as video element.
	 * Never forget to detach blob url of the image after not use it anymore.
	 */
	async getAsVideo(blob: Blob): Promise<HTMLVideoElement | null> {
		return new Promise((resolve, reject) => {
			let blobURL = URL.createObjectURL(blob)

			let video = document.createElement('video')
			video.preload = 'auto'

			video.oncanplaythrough = () => {
				resolve(video)
			}

			video.onerror = err => {
				reject(err)
			}

			video.src = blobURL
		})
	}
}


/** Default loader to load miscellaneous resources. */
export const loader = new ResourceLoader()
