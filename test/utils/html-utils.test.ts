import * as HTMLUtils from '../../src/utils/html-utils'


describe('Test HTMLUtils', () => {
	test('encodeToHTML', () => {
		expect(HTMLUtils.encodeToHTML('<a>')).toEqual('&lt;a&gt;')
	})

	test('decodeFromHTML', () => {
		expect(HTMLUtils.decodeFromHTML('&lt;a&gt;')).toEqual('<a>')
	})

	test('htmlToText', () => {
		expect(HTMLUtils.htmlToText('<a>12345</a>')).toEqual('12345')
	})

	test('textToHTML', () => {
		expect(HTMLUtils.textToHTML('12345')).toEqual('<p>12345</p>')
	})

	test('cleanUnsafeHTML', () => {
		expect(HTMLUtils.cleanUnsafeHTML('abc<script></script>')).toEqual('abc')
		expect(HTMLUtils.cleanUnsafeHTML('abc<script a=b></script>')).toEqual('abc')
		expect(HTMLUtils.cleanUnsafeHTML('<div onerror="..."></div>')).toEqual('<div></div>')
		expect(HTMLUtils.cleanUnsafeHTML('<div onerror=\n"..."></div>')).toEqual('<div></div>')
	})
})