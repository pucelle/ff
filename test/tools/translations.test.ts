import {GlobalTranslations} from '../../src/tools/translations'


describe('Test translations', () => {
	
	test('GlobalTranslations', () => {
		GlobalTranslations.add('enus', {
			key: 'Translate of {0}'
		})

		expect(GlobalTranslations.getCurrentLanguage()).toEqual('enus')
		GlobalTranslations.setCurrentLanguage('zhcn')
		expect(GlobalTranslations.getCurrentLanguage()).toEqual('zhcn')
		GlobalTranslations.setCurrentLanguage('enus')
		expect(GlobalTranslations.getCurrentLanguage()).toEqual('enus')

		expect(GlobalTranslations.get('key', 'what')).toEqual('Translate of what')
		expect(GlobalTranslations.translate('What@@key', 'what')).toEqual('Translate of what')
		expect(GlobalTranslations.translate('What@@key2')).toEqual('What')
		expect(GlobalTranslations.translateWithQuoteToBold('"What"@@key2')).toEqual('<b>What</b>')
	})
})