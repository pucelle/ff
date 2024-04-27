/// <reference types="../node_modules/@types/chai" />

import * as ff from '../../..'
import * as helper from './helper'
const assert = chai.assert


let mouseEnter = (el: HTMLElement) => {
	let event = new MouseEvent('mouseenter')
	el.dispatchEvent(event)
}

let mouseLeave = (el: HTMLElement) => {
	let event = new MouseEvent('mouseleave')
	el.dispatchEvent(event)
}


describe('Test MouseLeave', () => {
	it('on', async () => {
		let fn = helper.fn()

		let div1 = document.createElement('div')
		div1.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;'
		document.body.append(div1)

		let div2 = document.createElement('div')
		div2.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;'
		document.body.append(div2)

		ff.MouseLeave.on([div1, div2], fn)
		
		mouseEnter(div1)
		await ff.sleep(100)
		mouseLeave(div1)
		await ff.sleep(100)
		mouseEnter(div2)
		await ff.sleep(100)
		mouseLeave(div2)
		await ff.sleep(100)
		assert.equal(fn.mock.calls.length, 0)

		await new Promise(resolve => setTimeout(resolve, 150))
		assert.equal(fn.mock.calls.length, 1)

		div1.remove()
		div2.remove()
	})

	it('once', async () => {
		let calledTimes = 0
		let fn = () => {
			calledTimes++
		}

		let div1 = document.createElement('div')
		div1.style.cssText = 'position: fixed; width: 100px; height: 100px; left: 0; top: 0;'
		document.body.append(div1)

		ff.MouseLeave.once([div1], fn)

		mouseEnter(div1)
		mouseLeave(div1)
		await new Promise(resolve => setTimeout(resolve, 200))
		assert.equal(calledTimes, 1)
		await new Promise(resolve => setTimeout(resolve, 200))
		assert.equal(calledTimes, 1)

		div1.remove()
	})
})