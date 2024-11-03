import {DOMScroll} from '../../src'


describe('DOMScroll', () => {
	test('findClosestCSSScrollWrapper', async () => {
		let p = document.createElement('div')
		p.style.cssText = 'overflow-y: auto'

		let c = document.createElement('div')
		p.append(c)

		expect(DOMScroll.findClosestCSSScrollWrapper(p)).toEqual(p)
		expect(DOMScroll.findClosestCSSScrollWrapper(c)).toEqual(p)
	})


	test('getCSSOverflowDirection', async () => {
		let p = document.createElement('div')
		p.style.cssText = 'overflow-y: auto'

		let c = document.createElement('div')
		p.append(c)

		expect(DOMScroll.getCSSOverflowDirection(p)).toEqual('vertical')
		expect(DOMScroll.getCSSOverflowDirection(c)).toEqual(null)

		p.style.cssText = 'overflow-x: auto'
		expect(DOMScroll.getCSSOverflowDirection(p)).toEqual('horizontal')

		// Jest cant spread this property to both directions.
		// p.style.cssText = 'overflow: auto'
		// expect(DOMScroll.getCSSOverflowDirection(p)).toEqual('vertical')
	})
})
