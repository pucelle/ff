import {Settings} from '../../src'
import {describe, expect, it} from 'vitest'


class TestSettings extends Settings<{nullable: string | null, optional: string | undefined, hasOwnProperty: string}> {
	protected saveStorageData() {}
}


describe('Settings', () => {
	it('distinguishes explicit falsy values from missing defaults', () => {
		let settings = new TestSettings(
			{nullable: null, optional: undefined, hasOwnProperty: 'stored'},
			{nullable: 'default', optional: 'default', hasOwnProperty: 'default'},
		)

		expect(settings.get('nullable')).toEqual(null)
		expect(settings.get('optional')).toEqual(undefined)
		expect(settings.has('hasOwnProperty')).toEqual(true)

		settings.delete('optional')
		expect(settings.has('optional')).toEqual(false)
		expect(settings.get('optional')).toEqual('default')
	})
})
