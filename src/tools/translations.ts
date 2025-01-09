import {trackGet, trackSet} from '../observing'
import {StringUtils} from '../utils'


export class Translations {

	protected lang: string = 'en'
	protected data: Map<string, Record<string, string>> = new Map([['en', {}]])

	/** Get current language. */
	getLang(): string {
		trackGet(this, 'lang')
		return this.lang
	}

	/** Set current language. */
	setLang(lang: string) {
		this.lang = lang
		trackSet(this, 'lang')
	}

	/** Add a translation data pieces to translation data. */
	add(language: string, pieces: Record<string, string>) {
		let data = this.data.get(language)
		if (!data) {
			this.data.set(language, data = {})
		}

		Object.assign(data, pieces)
	}

	/** 
	 * Get translation value from key.
	 * If passes `args` parameter, will format with it as arguments.
	 */
	get(key: string, ...args: (string | number)[]): string {
		let data = this.data.get(this.lang)
		
		if (!data) {
			data = this.data.get('en')!
		}

		let value = data[key]

		if (args.length) {
			value = StringUtils.format(value, args)
		}

		trackGet(this, 'lang')

		return value
	}
	
	/** Translate, and replace quotes to `<b>`: `"xxx"` -> `<b>xxx</b>`. */
	getBolded(key: string, ...args: (string | number)[]): string {
		let value = this.get(key, ...args.map(arg => StringUtils.encodeHTML(String(arg))))
		return value.replace(/"(.+?)"/g, '<b>$1</b>')
	}
}


/** Global transition API. */
export const GlobalTranslations = new Translations()

/** Global translate function `t(key, ...)`. */
export const t = GlobalTranslations.get.bind(GlobalTranslations)