import {translations} from '../../src'
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
