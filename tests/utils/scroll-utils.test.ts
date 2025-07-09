import {ScrollUtils} from '../../src'


describe('ScrollUtils', () => {
	test('findClosestCSSScrollWrapper', async () => {
		let p = document.createElement('div')
		p.style.cssText = 'overflow-y: auto'

		let c = document.createElement('div')
		p.append(c)

		expect(ScrollUtils.findClosestCSSScrollWrapper(p)).toEqual(p)
		expect(ScrollUtils.findClosestCSSScrollWrapper(c)).toEqual(p)
	})


	test('getCSSOverflowDirection', async () => {
		let p = document.createElement('div')
		p.style.cssText = 'overflow-y: auto'

		let c = document.createElement('div')
		p.append(c)

		expect(ScrollUtils.getCSSOverflowDirection(p)).toEqual('vertical')
		expect(ScrollUtils.getCSSOverflowDirection(c)).toEqual(null)

		p.style.cssText = 'overflow-x: auto'
		expect(ScrollUtils.getCSSOverflowDirection(p)).toEqual('horizontal')

		// Jest cant spread this property to both directions.
		// p.style.cssText = 'overflow: auto'
		// expect(ScrollUtils.getCSSOverflowDirection(p)).toEqual('vertical')
	})
})
