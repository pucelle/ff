import {GlobalTranslations} from '../../src/tools/translations'


describe('Test translations', () => {
	
	test('GlobalTranslations', () => {
		GlobalTranslations.add('enus', {
			key1: 'Translate of {0}',
			key2: '"What"',
		})

		expect(GlobalTranslations.getCurrentLanguage()).toEqual('enus')
		GlobalTranslations.setCurrentLanguage('zhcn')
		expect(GlobalTranslations.getCurrentLanguage()).toEqual('zhcn')
		GlobalTranslations.setCurrentLanguage('enus')
		expect(GlobalTranslations.getCurrentLanguage()).toEqual('enus')

		expect(GlobalTranslations.get('key1', 'what')).toEqual('Translate of what')
		expect(GlobalTranslations.getBolded('key2')).toEqual('<b>What</b>')
	})
})