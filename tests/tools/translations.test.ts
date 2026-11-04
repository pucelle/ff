import {Translations, translations} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test translations', () => {
	
	it('GlobalTranslations', () => {
		translations.addData('en', {
			key1: 'Translate of {0}',
			key2: '"What"',
		})

		expect(translations.locale).toEqual('en')
		translations.locale = 'zh'
		expect(translations.locale).toEqual('zh')
		translations.locale = 'en'
		expect(translations.locale).toEqual('en')

		expect(translations.get('key1', 'what')).toEqual('Translate of what')
		expect(translations.getBolded('key2')).toEqual('<b>What</b>')
	})
})


it('translates explicit locales without mutating the selected locale', () => {
	let translator = new Translations()
	translator.addData('en', {greeting: 'Hello {0}'})
	translator.addData('zh-cn', {greeting: '你好 {0}'})
	let english = translator.getForLocale.bind(translator, 'en')
	let chinese = translator.getForLocale.bind(translator, 'zh-cn')
	translator.locale = 'zh-cn'
	expect(english('greeting', 'Alice')).toBe('Hello Alice')
	expect(chinese('greeting', 'Alice')).toBe('你好 Alice')
	expect(translator.locale).toBe('zh-cn')
	expect(translator.getForLocale('fr', 'greeting', 'Alice')).toBe('Hello Alice')
	expect(translator.locale).toBe('zh-cn')
})
