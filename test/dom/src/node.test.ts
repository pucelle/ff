/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
const assert = chai.assert


describe('Test node', () => {
	it('nodeIndex & elementIndex', () => {
		assert.equal(
			ff.getNodeIndex(document.body),
			[...document.documentElement.childNodes].indexOf(document.body)
		)

		assert.equal(
			ff.getElementIndex(document.body),
			[...document.documentElement.children].indexOf(document.body)
		)
	})

	it('innerWidth & innerHeight', () => {
		let div = document.createElement('div')
		div.style.cssText = 'width: 1000px; height: 100px; margin: 10px; padding: 10px;'
		document.body.appendChild(div)

		assert.equal(ff.getInnerWidth(div), 980)
		assert.equal(ff.getInnerHeight(div), 80)

		div.style.overflow = 'scroll'
		
		assert.equal(ff.getInnerWidth(div), 980 - ff.getScrollbarWidth())
		assert.equal(ff.getInnerHeight(div), 80 - ff.getScrollbarWidth())

		div.remove()
	})

	it('outerWidth & outerHeight', () => {
		let div = document.createElement('div')
		div.style.cssText = 'width: 1000px; height: 100px; margin: 10px; padding: 10px;'
		document.body.appendChild(div)

		assert.equal(ff.getOuterWidth(div), 1020)
		assert.equal(ff.getOuterHeight(div), 120)

		div.remove()
	})

	it('getRect', () => {
		document.body.style.height = '120%'
		let rect = document.body.getBoundingClientRect()

		let rectObj = {
			bottom: rect.bottom,
			height: rect.height,
			left: rect.left,
			right: rect.right,
			top: rect.top,
			width: rect.width,
		}

		assert.deepEqual(ff.getRect(document.body), rectObj)

		assert.deepEqual(ff.getRect(document.documentElement).width, document.documentElement.clientWidth)
		assert.deepEqual(ff.getRect(document.documentElement).height, document.documentElement.clientHeight)
		document.body.style.height = ''
	})

	it('isInview', () => {
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0'
		document.body.appendChild(div)
		assert.equal(ff.isInview(div), true)

		div.style.top = 'calc(100%)'
		assert.equal(ff.isInview(div), false)

		div.style.top = 'calc(100% - 50px)'
		assert.equal(ff.isInview(div, 0.4), true)
		assert.equal(ff.isInview(div, 0.6), false)

		div.remove()
	})
})
