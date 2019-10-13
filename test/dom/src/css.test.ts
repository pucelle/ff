/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
const assert = chai.assert


describe('Test css', () => {
	it('getStyleAsNumber', () => {
		assert.equal(
			ff.getStyleAsNumber(document.body, 'width'),
			parseFloat(getComputedStyle(document.body).width!)
		)

		assert.equal(
			ff.getStyleAsNumber(document.body, 'display'),
			0
		)
	})

	it('setCSS', () => {
		let div = document.createElement('div')
		document.body.appendChild(div)

		ff.setStyle(div, 'width', '1000px')
		assert.equal(div.style.width, '1000px')
		
		ff.setStyle(div, {width: 1200, height: 100})
		assert.equal(div.style.width, '1200px')
		assert.equal(div.style.height, '100px')

		div.remove()
	})
})
