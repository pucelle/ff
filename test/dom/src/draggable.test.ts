/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
const assert = chai.assert


describe('Test draggable', () => {
	it('setDraggable', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;'
		document.body.append(div)

		ff.setDraggable(div)

		let mouseDownEvent = new MouseEvent('mousedown', {
			clientX: 50,
			clientY: 50,
		})
		div.dispatchEvent(mouseDownEvent)

		let mouseMoveEvent = new MouseEvent('mousemove', {
			bubbles: true,
			clientX: 150,
			clientY: 150,
		})
		div.dispatchEvent(mouseMoveEvent)

		assert.equal(ff.getNumeric(div, 'left'), 100)
		assert.equal(ff.getNumeric(div, 'top'), 100)

		mouseMoveEvent = new MouseEvent('mousemove', {
			bubbles: true,
			clientX: -50,
			clientY: -50,
		})
		div.dispatchEvent(mouseMoveEvent)

		assert.equal(ff.getNumeric(div, 'left'), 0)
		assert.equal(ff.getNumeric(div, 'top'), 0)

		let mouseUpEvent = new MouseEvent('mouseup', {
			bubbles: true,
		})
		div.dispatchEvent(mouseUpEvent)

		div.remove()
	})
})