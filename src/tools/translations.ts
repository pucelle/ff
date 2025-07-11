import {Observed} from '@pucelle/lupos'
import {StringUtils} from '../utils'


export class Translations implements Observed {

	/** Current language. */
	lang: string = 'en'

	/** If can't find translation, try find in this fallback language. */
	fallbackLang: string = 'en'

	protected readonly map: Map<string, Record<string, string>> = new Map()

	/** Add a translation data pieces to translation data. */
	add(language: string, pieces: Record<string, string>) {
		let data = this.map.get(language)
		if (!data) {
			this.map.set(language, data = {})
		}

		Object.assign(data, pieces)
	}

	/** 
	 * Get translation value from key.
	 * If passes `args` parameter, will format with it as arguments.
	 */
	get(key: string, ...args: (string | number)[]): string {
		let data = this.map.get(this.lang)
		
		if (!data) {
			data = this.map.get('en')!
		}

		let value = data[key]

		if (args.length) {
			value = StringUtils.format(value, args)
		}

		return value
	}
	
	/** Translate, and replace quotes to `<b>`: `"xxx"` -> `<b>xxx</b>`. */
	getBolded(key: string, ...args: (string | number)[]): string {
		let value = this.get(key, ...args.map(arg => StringUtils.encodeHTML(String(arg))))
		return value.replace(/"(.+?)"/g, '<b>$1</b>')
	}
}


/** Global transition API. */
export const translations = new Translations()

/** Short for `translations.get(key, ...)`. */
export const t = translations.get.bind(translations)