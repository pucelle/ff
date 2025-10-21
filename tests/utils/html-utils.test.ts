import {HTMLUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test HTMLUtils', () => {
	it('encodeToHTML', () => {
		expect(HTMLUtils.encodeToHTML('<a>')).toEqual('&lt;a&gt;')
	})

	it('decodeFromHTML', () => {
		expect(HTMLUtils.decodeFromHTML('&lt;a&gt;')).toEqual('<a>')
	})

	it('htmlToText', () => {
		expect(HTMLUtils.htmlToText('<a>12345</a>')).toEqual('12345')
	})

	it('textToHTML', () => {
		expect(HTMLUtils.textToHTML('12345')).toEqual('<p>12345</p>')
	})

	it('cleanUnsafeHTML', () => {
		expect(HTMLUtils.cleanUnsafeHTML('abc<script></script>')).toEqual('abc')
		expect(HTMLUtils.cleanUnsafeHTML('abc<script a=b></script>')).toEqual('abc')
		expect(HTMLUtils.cleanUnsafeHTML('<div onerror="..."></div>')).toEqual('<div></div>')
		expect(HTMLUtils.cleanUnsafeHTML('<div onerror=\n"..."></div>')).toEqual('<div></div>')
	})
})