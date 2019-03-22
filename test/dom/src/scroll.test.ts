import * as ff from '../../../src'
const assert = chai.assert


describe('Test scroll', () => {
	it('hasScrollbar', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		div.innerHTML = '<div style="height: 200px;"></div>'
		document.body.append(div)
		assert.equal(ff.isContentOverflow(div), true)
		div.innerHTML = ''
		assert.equal(ff.isContentOverflow(div), false)
		div.remove()
	})

	it('getClosestScroller', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		div.innerHTML = '<div style="height: 200px;"></div>'
		document.body.append(div)

		assert.equal(ff.getClosestScrollWrapper(div), div)
		assert.equal(ff.getClosestScrollWrapper(div.firstElementChild as HTMLElement), div)
		div.remove()
	})

	it('scrollIntoView when content is not very high', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; overflow: auto;'
		div.innerHTML = `
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
			<div style="height: 50px;"></div>
		`
		document.body.append(div)

		ff.scrollToView(div.children[3] as HTMLElement)
		assert.equal(div.scrollTop, 100)

		ff.scrollToView(div.children[1] as HTMLElement)
		assert.equal(div.scrollTop, 50)
		div.remove()
	})

	it('scrollIntoView when content is very high', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; overflow: auto;'
		div.innerHTML = `
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
		`
		document.body.append(div)

		ff.scrollToView(div.lastElementChild as HTMLElement)
		assert.equal(div.scrollTop, 400)

		ff.scrollToView(div.firstElementChild as HTMLElement)
		assert.equal(div.scrollTop, 100)
		div.remove()
	})

	it('getScrollDirection', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		document.body.append(div)

		div.innerHTML = `<div style="width: 200px; height: 100px;"></div>`
		assert.equal(ff.getScrollDirection(div), 'x')

		div.innerHTML = `<div style="width: 100px; height: 200px;"></div>`
		assert.equal(ff.getScrollDirection(div), 'y')

		div.remove()
	})

	it('getScrollOffset', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px;'
		document.body.append(div)

		div.innerHTML = `<div style="width: 200px; height: 100px;"></div>`
		div.scrollLeft = 100
		assert.equal(ff.getScrollOffset(div.firstElementChild as HTMLElement, div, 'x'), 0)

		div.remove()
	})

	it('scrollToTop', async () => {
		let div = document.createElement('div')
		div.style.cssText = 'position: fixed; width: 100px; height: 100px; overflow: auto;'
		div.innerHTML = `
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
			<div style="height: 200px;"></div>
		`
		document.body.append(div)

		ff.scrollToTop(div.lastElementChild as HTMLElement)
		assert.equal(div.scrollTop, 400)

		ff.scrollToTop(div.firstElementChild as HTMLElement)
		assert.equal(div.scrollTop, 0)
		div.remove()
	})
})