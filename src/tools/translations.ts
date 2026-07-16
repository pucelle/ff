import {Observed, UnObserved} from 'lupos'
import {HTMLUtils, StringUtils} from '../utils'


export class Translations implements Observed {

	/** Current language and country code, or only language. */
	locale: string = 'en'

	/** If can't find translation, try find in this fallback locale. */
	fallbackLocale: string = 'en'

	/** Map to cache translations of all locales. */
	protected readonly map: UnObserved<Map<string, Record<string, string>>> = new Map()

	/** Add a translation data pieces to translation data. */
	addData(locale: string, pieces: Record<string, string>) {
		let data = this.map.get(locale)
		if (!data) {
			this.map.set(locale, data = {})
		}

		Object.assign(data, pieces)
	}

	/** Get all translation data pieces. */
	getData(locale: string): Record<string, string> | undefined {
		return this.map.get(locale)
	}

	/** 
	 * Get translation value from key.
	 * If passes `args` parameter, will format with it as arguments.
	 */
	get(key: string, ...args: (string | number)[]): string {
		let data = this.map.get(this.locale)
		
		if (!data) {
			console.warn(`No data table in locale '${this.locale}'`)

			data = this.map.get(this.fallbackLocale)

			if (!data) {
				console.warn(`No data table in fallback locale '${this.locale}'`)
				return ''
			}
		}

		let value = data[key]

		if (value === undefined) {
			console.warn(`No data item '${key}' in locale '${this.locale}'`)
			value = ''
		}

		if (args.length) {
			value = StringUtils.format(value, args)
		}


		return value
	}
	
	/** Translate, and replace quotes to `<b>`: `"xxx"` -> `<b>xxx</b>`. */
	getBolded(key: string, ...args: (string | number)[]): string {
		let value = this.get(key, ...args.map(arg => HTMLUtils.encodeToHTML(String(arg))))
		return value.replace(/"(.+?)"/g, '<b>$1</b>')
	}
}


/** Global transition API. */
export const translations = /*#__PURE__*/new Translations()

/** Short for `translations.get(key, ...)`. */
export const t = /*#__PURE__*/translations.get.bind(translations)