/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
const assert = chai.assert


describe('Test animate', () => {
	it('animateProperty', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0'
		document.body.append(div)

		let d = Date.now()
		await ff.animateProperty(div, 'left', 0, 100, 100).promise
		assert.equal(ff.getNumeric(div, 'left'), 100)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		await ff.animatePropertyTo(div, 'left', 200, 100).promise
		assert.equal(ff.getNumeric(div, 'left'), 200)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		await ff.animatePropertyFrom(div, 'left', 100, 100).promise
		assert.equal(ff.getNumeric(div, 'left'), 200)
		assert.closeTo(Date.now() - d, 100, 50)

		assert.isBelow(ff.getEasingFunction('ease-in')(0.5), ff.getEasingFunction('linear')(0.5))
		assert.isAbove(ff.getEasingFunction('ease-out')(0.5), ff.getEasingFunction('linear')(0.5))

		div.remove()
	})

	it('animateByFunction', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0'
		document.body.append(div)

		let d = Date.now()
		await ff.animateByFunction((value) => {ff.setStyle(div, 'left', value)}, 0, 100, 100).promise
		assert.equal(ff.getNumeric(div, 'left'), 100)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		await ff.animateByFunction((value) => {ff.setStyle(div, 'left', value)}, 100, 200, 100).promise
		assert.equal(ff.getNumeric(div, 'left'), 200)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		await ff.animateByFunction((value) => {ff.setStyle(div, 'left', value)}, 200, 100, 100).promise
		assert.equal(ff.getNumeric(div, 'left'), 100)
		assert.closeTo(Date.now() - d, 100, 50)

		div.remove()
	})

	it('animate', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0'
		document.body.append(div)

		let d = Date.now()
		await ff.animate(div, {left: 0}, {left: 100}, 100)
		assert.equal(ff.getNumeric(div, 'left'), 0)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		await ff.animateTo(div, {left: 200}, 100)
		assert.equal(ff.getNumeric(div, 'left'), 200)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		await ff.animateFrom(div, {left: 100}, 100)
		assert.equal(ff.getNumeric(div, 'left'), 200)
		assert.closeTo(Date.now() - d, 100, 50)

		d = Date.now()
		let promise = ff.animateToNextFrame(div, 'left', 100)
		div.style.left = '300px'
		await promise
		assert.equal(ff.getNumeric(div, 'left'), 300)
		assert.closeTo(Date.now() - d, 100, 50)

		div.remove()
	})
})