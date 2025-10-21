import {Color} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Test transition', () => {
	
	it('fromString', () => {
		expect(Color.fromString('#368')!.toString()).toEqual('#336688')
		expect(Color.fromString('#123456')!.toString()).toEqual('#123456')
		expect(Color.fromString('#80808080')!.toString()).toEqual('rgba(128, 128, 128, 0.5)')
		expect(Color.fromString('RGB(128, 128, 128)')!.toString()).toEqual('#808080')
		expect(Color.fromString('RGBA(128, 128, 128, 0.5)')!.toString()).toEqual('rgba(128, 128, 128, 0.5)')
		expect(Color.fromString('RGBA(#808080, 0.5)')!.toString()).toEqual('rgba(128, 128, 128, 0.5)')
	})

	it('fromHSL & fromHSLA', () => {
		expect(Color.fromHSL(0, 1, 1)!.toString()).toEqual('#ffffff')
		expect(Color.fromHSL(0, 1, 0.5)!.toString()).toEqual('#ff0000')
		expect(Color.fromHSL(1, 1, 0.5)!.toString()).toEqual('#ffff00')
		expect(Color.fromHSL(2, 1, 0.5)!.toString()).toEqual('#00ff00')
		expect(Color.fromHSL(3, 1, 0.5)!.toString()).toEqual('#00ffff')
		expect(Color.fromHSL(4, 1, 0.5)!.toString()).toEqual('#0000ff')
		expect(Color.fromHSL(5, 1, 0.5)!.toString()).toEqual('#ff00ff')

		expect(Color.fromHSLA(0, 1, 0.5, 0.5)!.toString()).toEqual('rgba(255, 0, 0, 0.5)')
	})

	it('Color properties', () => {
		let c = Color.fromString('#ff0000')!
		expect(c.clone().equals(c)).toEqual(true)
		expect(c.toRGB()).toEqual('rgb(255, 0, 0)')
		expect(c.toRGBA()).toEqual('rgba(255, 0, 0, 1)')
		expect(c.toHEX()).toEqual('#ff0000')
		expect(c.toHSL()).toEqual('hsl(0, 100%, 50%)')
		expect(c.toHSLA()).toEqual('hsla(0, 100%, 50%, 1)')
		expect(c.gray).toEqual(1/3)
		expect(c.darken(0.1).toString()).toEqual('#e60000')
		expect(c.lighten(0.1).toString()).toEqual('#ff1a1a')
		expect(c.invert().toString()).toEqual('#00ffff')
		expect(c.toIntermediate(0.1).toString()).toEqual('#ff1a1a')
		expect(c.invert().toIntermediate(0.1).toString()).toEqual('#00e6e6')
		expect(c.mix(Color.fromString('#fff')!, 0.5).toString()).toEqual('#ff8080')
		expect(c.toString()).toEqual('#ff0000')
		expect(Color.fromString('#ee0000')!.improveContrast(c, 0.1)).toEqual('#cc0000')
	})
})