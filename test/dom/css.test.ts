import * as DOMUtils from '../../src/tools/dom-utils'


describe('Test css', () => {
	it('getStyleAsNumber', () => {
		expect(DOMUtils.getNumericStyleValue(document.body, 'width')).toEqual(
			parseFloat(getComputedStyle(document.body).width!)
		)

		expect(DOMUtils.getNumericStyleValue(document.body, 'display')).toEqual(0)
	})

	// it('setCSS', () => {
	// 	let div = document.createElement('div')
	// 	document.body.appendChild(div)

	// 	DOMUtils.setStyleValue(div, 'width', '1000px')
	// 	expect(div.style.width).toEqual('1000px')
		
	// 	DOMUtils.setStyleValues(div, {width: 1200, height: 100})
	// 	expect(div.style.width).toEqual('1200px')
	// 	expect(div.style.height).toEqual('100px')

	// 	div.remove()
	// })
})
