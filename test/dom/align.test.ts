/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
const assert = chai.assert


describe('Test align', () => {
	it('align with positions t | b | c | l | r', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 't')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 250)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 100)

		ff.align(div, target, 'b')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 250)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)

		ff.align(div, target, 'c')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 250)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 250)

		ff.align(div, target, 'l')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 100)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 250)

		ff.align(div, target, 'r')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 400)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 250)

		div.remove()
		target.remove()
	})

	it('align with positions tl | tr | bl | br | lt | lb | rt | rb', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 200)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 100)

		ff.align(div, target, 'tr')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 300)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 100)

		ff.align(div, target, 'bl')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 200)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)

		ff.align(div, target, 'br')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 300)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)

		ff.align(div, target, 'lt')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 100)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 200)

		ff.align(div, target, 'lb')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 100)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 300)

		ff.align(div, target, 'rt')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 400)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 200)

		ff.align(div, target, 'rb')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 400)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 300)

		div.remove()
		target.remove()
	})

	it('other aligns', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'b-t')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 250)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 100)

		div.remove()
		target.remove()
	})

	it('align with positions in corners', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'br-tl')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 100)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 100)

		ff.align(div, target, 'bl-tr')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 400)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 100)

		ff.align(div, target, 'tl-br')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 400)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)

		ff.align(div, target, 'tr-bl')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 100)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)

		div.remove()
		target.remove()
	})

	it('should align to opposite place when not enough space', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 50px; top: 50px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 50)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 250)

		ff.align(div, target, 'lt')
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 250)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 50)

		target.style.cssText = 'position: fixed; right: 50px; bottom: 50px; width: 200px; height: 200px;'
		ff.align(div, target, 'br')
		assert.closeTo(ff.getStyleValueAsNumber(div, 'left'), ff.getRect(target).right - ff.getRect(div).width, 1)
		assert.closeTo(ff.getStyleValueAsNumber(div, 'top'), ff.getRect(target).top - ff.getRect(div).height, 1)

		ff.align(div, target, 'rb')
		assert.closeTo(ff.getStyleValueAsNumber(div, 'left'), ff.getRect(target).left - ff.getRect(div).width, 1)
		assert.closeTo(ff.getStyleValueAsNumber(div, 'top'), ff.getRect(target).bottom - ff.getRect(div).height, 1)

		div.remove()
		target.remove()
	})

	it('should align triangle', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		div.innerHTML = '<div style="position: absolute; width: 20px; height: 20px; left: 0; bottom: -20px;"></div>'
		let triangle = div.firstElementChild as HTMLElement

		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 80)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'left'), 40)

		ff.align(div, target, 'br', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 420)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'left'), 40)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'top'), -20)

		triangle.style.left = '-20px'

		ff.align(div, target, 'lt', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 80)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'top'), 40)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'right'), -20)

		ff.align(div, target, 'rb', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 420)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'top'), 40)

		div.remove()
		target.remove()
	})

	it('should align triangle to the middle of target when target is smaller than el', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 200px; height: 200px;'
		div.innerHTML = '<div style="position: absolute; width: 20px; height: 20px; left: 0; bottom: -20px;"></div>'
		let triangle = div.firstElementChild as HTMLElement

		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 300px; top: 300px; width: 100px; height: 100px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 80)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'left'), 40)
		assert.equal(triangle.style.transform, '')

		ff.align(div, target, 'br', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 420)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'left'), 140)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'top'), -20)
		assert.equal(triangle.style.transform, 'rotateX(180deg)')

		triangle.style.top = '-20px'
		triangle.style.bottom = ''
		ff.align(div, target, 'tl', {triangle})
		assert.equal(triangle.style.transform, 'rotateX(180deg)')

		triangle.style.top = '-20px'
		triangle.style.bottom = ''
		ff.align(div, target, 'br', {triangle})
		assert.equal(triangle.style.transform, '')


		triangle.style.left = '-20px'
		ff.align(div, target, 'lt', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 80)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'top'), 40)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'right'), -20)
		assert.equal(triangle.style.transform, 'rotateY(180deg)')

		triangle.style.left = '-20px'
		triangle.style.right = ''
		ff.align(div, target, 'rb', {triangle})
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 420)
		assert.equal(ff.getStyleValueAsNumber(triangle, 'top'), 140)
		assert.equal(triangle.style.transform, '')

		div.remove()
		target.remove()
	})

	it('should set overflow when el is too high and canOverflowY set', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; overflow: auto;'
		div.innerHTML = '<div style="width: 100px; height: 1000px;"></div>'

		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl', {canShrinkInY: true})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)
		assert.isBelow(ff.getStyleValueAsNumber(div, 'height'), 1000)

		div.scrollTop = 100
		ff.align(div, target, 'br', {canShrinkInY: true})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 400)
		assert.isBelow(ff.getStyleValueAsNumber(div, 'height'), 1000)
		assert.equal(div.scrollTop, 100)

		div.remove()
		target.remove()
	})

	it('should set overflow when el is too high and canOverflowY set and will align top', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; overflow: auto;'
		div.innerHTML = '<div style="width: 100px; height: 1000px;"></div>'

		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; bottom: 100px; right: 100px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl', {canShrinkInY: true})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 0)
		assert.isBelow(ff.getStyleValueAsNumber(div, 'height'), 1000)

		div.scrollTop = 100
		ff.align(div, target, 'br', {canShrinkInY: true})
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 0)
		assert.isBelow(ff.getStyleValueAsNumber(div, 'height'), 1000)
		assert.equal(div.scrollTop, 100)

		div.remove()
		target.remove()
	})

	it('should throw when position is not correct', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'

		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		assert.throw(() => ff.align(div, target, 'tl'))
		
		div.remove()
		target.remove()
	})

	it('should align when el is absolute position', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: absolute; width: 100px; height: 100px; left: 100px; top: 100px;'
		div.innerHTML = '<div style="position: absolute; width: 100px; height: 100px;"></div>'
		let child = div.firstElementChild as HTMLElement

		let target = document.createElement('div')
		target.style.cssText = 'position: absolute; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(child, target, 'tl')
		assert.equal(ff.getStyleValueAsNumber(child, 'left'), 100)
		assert.equal(ff.getStyleValueAsNumber(child, 'top'), 0)
		
		div.remove()
		target.remove()
	})

	it('should add margin', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		
		let target = document.createElement('div')
		target.style.cssText = 'position: fixed; left: 200px; top: 200px; width: 200px; height: 200px;'
		document.body.append(div, target)

		ff.align(div, target, 'tl', {margin: 20})
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 180)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 80)
		
		div.remove()
		target.remove()
	})

	it('should align event', () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		document.body.append(div)
		
		let event = new MouseEvent('mousedown', {
			clientX: 100,
			clientY: 100,
		})
		
		ff.alignToEvent(div, event, [10, 10])
		assert.equal(ff.getStyleValueAsNumber(div, 'left'), 110)
		assert.equal(ff.getStyleValueAsNumber(div, 'top'), 110)
		div.remove()
	})
})
