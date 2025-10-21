import {ScrollUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('ScrollUtils', () => {
	it('findClosestCSSScrollWrapper', async () => {
		let p = document.createElement('div')
		p.style.cssText = 'overflow-y: auto'

		let c = document.createElement('div')
		p.append(c)

		expect(ScrollUtils.findClosestCSSScrollWrapper(p)?.wrapper).toEqual(p)
		expect(ScrollUtils.findClosestCSSScrollWrapper(c)?.wrapper).toEqual(p)
	})


	it('getCSSOverflowDirection', async () => {
		let p1 = document.createElement('div')
		p1.style.cssText = 'overflow-y: auto'
		expect(ScrollUtils.getCSSOverflowDirection(p1)).toEqual('vertical')

		let p2 = document.createElement('div')
		p2.style.cssText = 'overflow-x: auto'
		expect(ScrollUtils.getCSSOverflowDirection(p2)).toEqual('horizontal')

		let p3 = document.createElement('div')
		expect(ScrollUtils.getCSSOverflowDirection(p3)).toEqual(null)
	})
})
