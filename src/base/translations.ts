import {format} from './string'
import {encodeHTML} from './html'
import {assignIf} from './object'


export class Translations {

	protected language: string = 'enus'
	protected data: Map<string, Record<string, string>> = new Map([['enus', {}]])

	/** Get current language. */
	getLanguage() {
		return this.language
	}

	/** 
	 * Set current language and update all components.
	 * @language Language to set, like `enus`, `zhcn`.
	 */
	setLanguage(language: string) {
		this.language = language
	}

	/** 
	 * Add a translation pieces in `{key: value}` format.
	 * @language Language to add translation pieces to.
	 * @pieces Translation pieces, in `{key: translation, ...}` format.
	 */
	add(language: string, pieces: Record<string, string>) {
		let data = this.data.get(language)
		if (!data) {
			this.data.set(language, data = {})
		}

		Object.assign(data, pieces)
	}

	/** 
	 * Add a translation pieces in `{key: value}` format, assign only if translations with same keys not exist.
	 * @language Language to add translation pieces to.
	 * @pieces Translation pieces, in `{key: translation, ...}` format.
	 */
	addIf(language: string, pieces: Record<string, string>) {
		let data = this.data.get(language)
		if (!data) {
			this.data.set(language, data = {})
		}

		assignIf(data, pieces)
	}

	/** 
	 * Get translation value from key and may format with arguments.
	 * @param key Translation key.
	 * @param args Parameters format translation value.
	 */
	get(key: string, ...args: (string | number)[]): string {
		let data = this.data.get(this.language)
		
		if (!data) {
			data = this.data.get('enus')!
		}

		let value = data[key]

		if (args.length) {
			value = format(value, args)
		}

		return value
	}
	
	/** 
	 * Translate string like `DefaultValue@@key`.
	 * @param key Translation key.
	 * @param args Parameters format translation value.
	 */
	translate(key: string, ...args: (string | number)[]): string {
		let [defaultValue, id] = key.split('@@')
		let data = this.data.get(this.language)
		let value: string = ''

		if (!data) {
			data = this.data.get('enus')
		}

		if (id) {
			value = data![id] || defaultValue
		}

		if (args.length) {
			value = format(value, args)
		}

		return value
	}

	/** 
	 * Translate `"xxx"` to `<b>xxx</b>`.
	 * @param key Translation key.
	 * @param args Parameters format translation value.
	 */
	translateQuoteToBold(key: string, ...args: (string | number)[]): string {
		let value = this.translate(key, ...args.map(arg => encodeHTML(String(arg))))
		return value.replace(/"(.+?)"/g, '<b>$1</b>')
	}
}


/** Global transition API. */
export const translations = new Translations()
