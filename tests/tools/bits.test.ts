import {BitReader, BitWriter} from '../../src'
import {describe, expect, it} from 'vitest'


describe('bit streams', () => {
	it('round trips bytes with the high bit set through base64', () => {
		let writer = new BitWriter()
		writer.write(0x80, 8)
		writer.write(0xff, 8)

		let reader = BitReader.fromBase64(writer.toBase64())
		expect(reader.read(8)).toEqual(0x80)
		expect(reader.read(8)).toEqual(0xff)
		expect(reader.read(1)).toEqual(null)
	})

	it('pads a partial final byte', () => {
		let writer = new BitWriter()
		writer.write(0b101, 3)
		expect([...writer.flush()]).toEqual([0b10100000])
	})
})
