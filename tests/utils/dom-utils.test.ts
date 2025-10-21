import {DOMUtils} from '../../src'
import {describe, expect, it} from 'vitest'


describe('DOMUtils', () => {
	it('isNodeBefore', async () => {
		let p = document.createElement('div')
		let c1 = document.createElement('div')
		let c2 = document.createElement('div')
		p.append(c1, c2)

		expect(DOMUtils.isNodeBefore(c1, c2)).toEqual(true)
		expect(DOMUtils.isNodeBefore(p, c1)).toEqual(true)

		expect(DOMUtils.isNodeBefore(c2, c1)).toEqual(false)
		expect(DOMUtils.isNodeBefore(c1, p)).toEqual(false)
	})


	it('isNodeAfter', async () => {
		let p = document.createElement('div')
		let c1 = document.createElement('div')
		let c2 = document.createElement('div')
		p.append(c1, c2)

		expect(DOMUtils.isNodeAfter(c1, c2)).toEqual(false)
		expect(DOMUtils.isNodeAfter(p, c1)).toEqual(false)

		expect(DOMUtils.isNodeAfter(c2, c1)).toEqual(true)
		expect(DOMUtils.isNodeAfter(c1, p)).toEqual(true)
	})


	it('nodeIndexOf', async () => {
		let p = document.createElement('div')
		let c1 = document.createTextNode('')
		let c2 = document.createElement('div')
		p.append(c1, c2)

		expect(DOMUtils.nodeIndexOf(p)).toEqual(-1)
		expect(DOMUtils.nodeIndexOf(c1)).toEqual(0)
		expect(DOMUtils.nodeIndexOf(c2)).toEqual(1)
	})


	it('elementIndexOf', async () => {
		let p = document.createElement('div')
		let c1 = document.createTextNode('')
		let c2 = document.createElement('div')
		p.append(c1, c2)

		expect(DOMUtils.elementIndexOf(p)).toEqual(-1)
		expect(DOMUtils.elementIndexOf(c2)).toEqual(0)
	})


	it('getStyleValue & setStyleValue', async () => {
		let p = document.createElement('div')
		DOMUtils.setStyleValue(p, 'position', 'absolute')
		expect(DOMUtils.getStyleValue(p, 'position')).toEqual('absolute')
	})


	it('getNumericStyleValue & setNumericStyleValue', async () => {
		let p = document.createElement('div')
		DOMUtils.setNumericStyleValue(p, 'left', 100)
		expect(DOMUtils.getNumericStyleValue(p, 'left')).toEqual(100)
	})
})
