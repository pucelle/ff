/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
import * as helper from './helper'
const assert = chai.assert


describe('Test watch', () => {

	it('watch show', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0; display: none'
		document.body.append(div)

		let cancelWatch = ff.watchLayout(div, 'show', fn)
		assert.equal(fn.mock.calls.length, 0)
		await ff.sleep(50)
		div.style.display = 'block'

		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.equal(fn.mock.calls[0][0], true)

		div.style.display = 'none'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 2)
		assert.equal(fn.mock.calls[1][0], false)

		div.remove()
		cancelWatch()
	})

	it('watch show once', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0; display: none'
		document.body.append(div)

		let cancelWatch = ff.watchLayoutOnce(div, 'show', fn)
		assert.equal(fn.mock.calls.length, 0)
		await ff.sleep(50)
		div.style.display = 'block'

		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.equal(fn.mock.calls[0][0], true)

		div.style.display = 'none'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)

		div.remove()
		cancelWatch()
	})

	it('watch until', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0; display: none'
		document.body.append(div)

		let cancelWatch = ff.watchLayoutUntil(div, 'show', fn)
		assert.equal(fn.mock.calls.length, 0)
		div.style.display = 'block'

		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.equal(fn.mock.calls[0][0], true)

		div.style.display = 'none'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)

		div.remove()
		cancelWatch()
	})

	it('watch hide', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;'
		document.body.append(div)

		let cancelWatch = ff.watchLayout(div, 'hide', fn)
		assert.equal(fn.mock.calls.length, 0)
		await ff.sleep(50)

		div.style.display = 'none'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.equal(fn.mock.calls[0][0], true)

		div.remove()
		cancelWatch()
	})

	it('watch inview', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: -100px; top: -100px;'
		document.body.append(div)

		let cancelWatch = ff.watchLayout(div, 'inview', fn)
		assert.equal(fn.mock.calls.length, 0)

		div.style.left = '0'
		div.style.top = '0'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.equal(fn.mock.calls[0][0], true)

		div.remove()
		cancelWatch()
	})

	it('watch outview', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;'
		document.body.append(div)

		let cancelWatch = ff.watchLayout(div, 'outview', fn)
		assert.equal(fn.mock.calls.length, 0)

		div.style.left = '-100px'
		div.style.top = '-100px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.equal(fn.mock.calls[0][0], true)

		div.remove()
		cancelWatch()
	})

	it('watch size', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;'
		document.body.append(div)

		let cancelWatch = ff.watchLayout(div, 'size', fn)
		assert.equal(fn.mock.calls.length, 0)

		div.style.width = '200px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.deepEqual(fn.mock.calls[0][0], {width: 200, height: 100})

		div.style.height = '200px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 2)
		assert.deepEqual(fn.mock.calls[1][0], {width: 200, height: 200})

		div.remove()
		cancelWatch()
	})

	it('watch rect', async () => {
		let fn = helper.fn()
		let div = document.createElement('div')
		div.style.cssText = 'width: 100px; height: 100px; position: fixed; left: 0; top: 0;'
		document.body.append(div)

		let cancelWatch = ff.watchLayout(div, 'rect', fn)
		assert.equal(fn.mock.calls.length, 0)

		await ff.sleep(50)
		div.style.width = '200px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 1)
		assert.deepEqual(fn.mock.calls[0][0].width, 200)

		div.style.height = '200px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 2)
		assert.deepEqual(fn.mock.calls[1][0].height, 200)

		div.style.left = '100px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 3)
		assert.deepEqual(fn.mock.calls[2][0].left, 100)

		div.style.top = '100px'
		await ff.sleep(300)
		assert.equal(fn.mock.calls.length, 4)
		assert.deepEqual(fn.mock.calls[3][0].top, 100)

		div.remove()
		cancelWatch()
	})
})