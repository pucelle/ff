import {translations} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test translations', () => {
	
	it('GlobalTranslations', () => {
		translations.add('en', {
			key1: 'Translate of {0}',
			key2: '"What"',
		})

		expect(translations.lang).toEqual('en')
		translations.lang = 'zh'
		expect(translations.lang).toEqual('zh')
		translations.lang = 'en'
		expect(translations.lang).toEqual('en')

		expect(translations.get('key1', 'what')).toEqual('Translate of what')
		expect(translations.getBolded('key2')).toEqual('<b>What</b>')
	})
})