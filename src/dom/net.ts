import {firstMatch} from '../base/string'
import {Emitter, sum} from '../base'

type Resources = (string | {name?: string, url: string, type?: ResourceType})[]
type NormalizedResources = {name: string, url: string, type: ResourceType}[]
type ResourceType = 'css' | 'js' | 'blob'
type OnProgress = (loaded: number, total: number) => void

export interface ResourceLoaderOptions {

	/** URL base. */
	base?: string

	/** If `true`, will continue request other resource if error occurs, default value is `false` */
	continueOnError?: boolean
}

export interface ResourceLoaderEvents {
	progress: OnProgress
}


/**
 * Preload resources from their urls, and get total progress notifications.
 * Please beware of the CORS settings at the server.
 * If you want the progress working, please makesure the `content-length` response header.
 */
export class ResourceLoader extends Emitter<ResourceLoaderEvents> {

	/** URL base. */
	base: string = ''

	/** If `true`, will continue request other resource if error occurs, default value is `false` */
	continueOnError: boolean = false

	private blobMap: Map<string, Blob> = new Map()

	constructor(options: ResourceLoaderOptions = {}) {
		super()
		Object.assign(this, options)
	}

	async load(urls: Resources): Promise<void> {
		let normalized = this.normalizeResources(urls)
		let sizes = (await this.getTotalSizes(normalized.map(v => v.url))).map(v => v || 0)
		let totalSize = sum(sizes)
		let completedSize = 0

		for (let {name, url, type} of normalized) {
			try {
				let blob = await this.loadOne(name, url, (loaded: number) => {
					this.emit('progress', Math.min(completedSize + loaded, totalSize), totalSize)
				})

				completedSize += sizes.shift()!

				if (blob) {
					await this.handleBlob(type, blob)
				}
			}
			catch (err) {
				if (!this.continueOnError) {
					throw err
				}
			}
		}
	}

	private async getTotalSizes(urls: string[]): Promise<(number | null)[]> {
		let promises: Promise<number | null>[] = []
		for (let url of urls) {
			promises.push(this.getURLSize(url))
		}
		return await Promise.all(promises)
	}

	private async getURLSize(url: string): Promise<number | null> {
		let res = await fetch(this.getAbsoluteURL(url), {method: 'HEAD'})
		let length = res.headers.get('content-length')
		return length === null ? null : Number(length) || null
	}

	private getAbsoluteURL(url: string) {
		if (/^(?:https?:|\/\/)/.test(url) || !this.base) {
			return url
		}
	
		return this.base + url
	}

	private normalizeResources(resources: Resources): NormalizedResources {
		return resources.map(r => {
			if (typeof r === 'string') {
				return {
					name: this.getBaseNameFromURL(r),
					url: r,
					type: this.inferResourceTypeFromURL(r)
				}
			}
			else {
				return {
					name: r.name || this.getBaseNameFromURL(r.url),
					url: r.url,
					type: r.type || 'blob'
				}
			}
		})
	}

	private getBaseNameFromURL(url: string) {
		return firstMatch(url, /([^\/]+)$/).replace(/\.\w+$/, '')
	}

	private inferResourceTypeFromURL(url: string): ResourceType {
		let ext = firstMatch(url, /\.(\w+)(?:\?.*?)?$/).toLowerCase()

		if (['css', 'js'].includes(ext)) {
			return ext as ResourceType
		}
		else {
			return 'blob'
		}
	}
		
	private async loadOne(name: string, url: string, onprogress: OnProgress): Promise<Blob | null> {
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
					this.blobMap.set(name, xhr.response)
					this.blobMap.set(absloteURL, xhr.response)
					resolve(xhr.response)
				}
				else {
					reject()
				}
			}

			xhr.send()
		})
	}

	private async handleBlob(type: ResourceType, blob: Blob): Promise<void> {
		if (type === 'css') {
			await this.loadStyle(blob)
		}
		else if (type === 'js') {
			await this.loadScript(blob)
		}
	}

	private loadStyle(blob: Blob): Promise<void> {
		return new Promise((resolve, reject) => {
			let link = document.createElement('link')
			link.rel = 'stylesheet'
			link.href = URL.createObjectURL(blob)
			document.head.append(link)
			link.addEventListener('load', () => resolve())
			link.addEventListener('error', () => reject())
		})
	}

	private loadScript(blob: Blob): Promise<void> {
		return new Promise((resolve, reject) => {
			let script = document.createElement('script')
			script.async = false
			script.src = URL.createObjectURL(blob)
			document.head.append(script)
			
			script.addEventListener('load', () => resolve())
			script.addEventListener('error', () => reject())
		})
	}
	
	/**
	 * Get resource as blob URL.
	 * @param name The defined resource name or base name of url.
	 */
	getAsBlobURL(name: string): string | null {
		let blob = this.blobMap.get(name)
		if (!blob) {
			return null
		}

		return URL.createObjectURL(blob)
	}
	
	/**
	 * Get resource as text.
	 * @param name The defined resource name or base name of url.
	 */
	getAsText(name: string): Promise<string | null> {
		return new Promise(resolve => {
			let blob = this.blobMap.get(name)
			if (!blob) {
				return resolve(null)
			}

			let reader = new FileReader()
			reader.onload = () => {
				resolve(reader.result as string)
			}
			reader.readAsText(blob)
		})
	}

	/**
	 * Get resource as HTML document.
	 * @param name The defined resource name or base name of url.
	 */
	async getAsHTML(name: string): Promise<HTMLDocument | null> {
		let text = await this.getAsText(name)
		if (!text) {
			return null
		}

		return new DOMParser().parseFromString(text, 'text/html')
	}

	/**
	 * Get resource as JSON.
	 * @param name The defined resource name or base name of url.
	 */
	async getAsJSON(name: string): Promise<any | null> {
		let text = await this.getAsText(name)
		if (!text) {
			return null
		}

		return JSON.parse(text)
	}

	/**
	 * Get resource as ArrayBuffer.
	 * @param name The defined resource name or base name of url.
	 */
	async getAsBuffer(name: string): Promise<ArrayBuffer | null> {
		return new Promise(resolve => {
			let blob = this.blobMap.get(name)
			if (!blob) {
				return resolve(null)
			}

			let reader = new FileReader()
			reader.onload = () => {
				resolve(reader.result as ArrayBuffer)
			}
			reader.readAsArrayBuffer(blob)
		})
	}

	/**
	 * Get resource as Image.
	 * @param name The defined resource name or base name of url.
	 */
	async getAsImage(name: string): Promise<HTMLImageElement | null> {
		return new Promise(resolve => {
			let blobURL = this.getAsBlobURL(name)
			if (!blobURL) {
				return resolve(null)
			}

			let img = new Image()
			img.src = blobURL
			img.onload = () => resolve(img)
		})
	}
}
