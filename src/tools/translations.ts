import {StringUtils} from '../utils'


export class Translations {

	protected language: string = 'enus'
	protected data: Map<string, Record<string, string>> = new Map([['enus', {}]])

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
			data = this.data.get('enus')!
		}

		let value = data[key]

		if (args.length) {
			value = StringUtils.format(value, args)
		}

		return value
	}
	
	/** 
	 * Translate string like `DefaultValue@@key`.
	 * Would choose `DefaultValue` part if no relevent translation data exist.
	 */
	translate(key: string, ...args: (string | number)[]): string {
		let [defaultValue, id] = key.split('@@')
		let data = this.data.get(this.language)
		let value = defaultValue

		if (!data) {
			data = this.data.get('enus')
		}

		if (id) {
			value = data![id] ?? defaultValue
		}

		if (args.length) {
			value = StringUtils.format(value, args)
		}

		return value
	}

	/** Translate, and replace `"xxx"` to `<b>xxx</b>`. */
	translateWithQuoteToBold(key: string, ...args: (string | number)[]): string {
		let value = this.translate(key, ...args.map(arg => StringUtils.encodeHTML(String(arg))))
		return value.replace(/"(.+?)"/g, '<b>$1</b>')
	}
}


/** Global transition API. */
export const GlobalTranslations = new Translations()
