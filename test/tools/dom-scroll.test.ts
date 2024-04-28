import {DOMScroll} from '../../src/tools'


describe('DOMScroll', () => {
	test('getClosestCSSScrollWrapper', async () => {
		let p = document.createElement('div')
		p.style.cssText = 'overflow-y: auto'

		let c = document.createElement('div')
		p.append(c)

		expect(DOMScroll.getClosestCSSScrollWrapper(p)).toEqual(p)
		expect(DOMScroll.getClosestCSSScrollWrapper(c)).toEqual(p)
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
