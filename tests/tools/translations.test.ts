import {GlobalTranslations} from '../../src'


describe('Test translations', () => {
	
	test('GlobalTranslations', () => {
		GlobalTranslations.add('enUS', {
			key1: 'Translate of {0}',
			key2: '"What"',
		})

		expect(GlobalTranslations.getCurrentLanguage()).toEqual('enUS')
		GlobalTranslations.setCurrentLanguage('zhCN')
		expect(GlobalTranslations.getCurrentLanguage()).toEqual('zhCN')
		GlobalTranslations.setCurrentLanguage('enUS')
		expect(GlobalTranslations.getCurrentLanguage()).toEqual('enUS')

		expect(GlobalTranslations.get('key1', 'what')).toEqual('Translate of what')
		expect(GlobalTranslations.getBolded('key2')).toEqual('<b>What</b>')
	})
})