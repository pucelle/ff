import {translations} from '../../src'


describe('Test translations', () => {
	
	test('GlobalTranslations', () => {
		translations.add('en', {
			key1: 'Translate of {0}',
			key2: '"What"',
		})

		expect(translations.getLanguage()).toEqual('en')
		translations.setLanguage('zh')
		expect(translations.getLanguage()).toEqual('zh')
		translations.setLanguage('en')
		expect(translations.getLanguage()).toEqual('en')

		expect(translations.get('key1', 'what')).toEqual('Translate of what')
		expect(translations.getBolded('key2')).toEqual('<b>What</b>')
	})
})