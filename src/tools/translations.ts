import {StringUtils} from '../utils'


export class Translations {

	protected language: string = 'enUS'
	protected data: Map<string, Record<string, string>> = new Map([['enUS', {}]])

	/** Get current language. */
	getCurrentLanguage(): string {
		return this.language
	}

	/** Set current language. */
	setCurrentLanguage(language: string) {
		this.language = language
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
		let data = this.data.get(this.language)
		
		if (!data) {
			data = this.data.get('enUS')!
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
export const GlobalTranslations = new Translations()
