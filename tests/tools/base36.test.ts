import {Base36} from '../../src'
import {describe, expect, it} from 'vitest'


describe('Base36', () => {
	it('packs two radix-6 values into one character', () => {
		let base36 = new Base36(6)

		expect(base36.valuesPerChunk).toEqual(2)
		expect(base36.charactersPerChunk).toEqual(1)
		expect(base36.encode([1, 2])).toEqual('8')
		expect(base36.decode('8')).toEqual([1, 2])
	})

	it('pads an incomplete radix-4 chunk with zero', () => {
		let base36 = new Base36(4)

		expect(base36.encode([1, 2, 3])).toEqual('6c')
		expect(base36.decode('6c')).toEqual([1, 2, 3, 0])
		expect(base36.getEncodedLength(3)).toEqual(2)
	})

	it('packs three radix-8 values into two characters', () => {
		let base36 = new Base36(8)

		expect(base36.valuesPerChunk).toEqual(3)
		expect(base36.charactersPerChunk).toEqual(2)
		expect(base36.encode([1, 2, 3])).toEqual('2b')
		expect(base36.decode('2b')).toEqual([1, 2, 3])
		expect(base36.getEncodedLength(3)).toEqual(2)
	})

	it('returns encoded lengths without encoding', () => {
		let base36 = new Base36(8)

		expect(base36.getEncodedLength(0)).toEqual(0)
		expect(base36.getEncodedLength(1)).toEqual(2)
		expect(base36.getEncodedLength(4)).toEqual(4)
		expect(base36.getDecodedLength(0)).toEqual(0)
		expect(base36.getDecodedLength(2)).toEqual(3)
		expect(base36.getDecodedLength(4)).toEqual(6)
		expect(() => base36.getDecodedLength(1)).toThrow(RangeError)
	})

	it('does not mutate the input and rejects invalid data', () => {
		let base36 = new Base36(6)
		let values = [1]

		expect(base36.encode(values)).toEqual('6')
		expect(values).toEqual([1])
		expect(() => base36.encode([6])).toThrow(RangeError)
		expect(() => base36.decode('!')).toThrow(RangeError)
		expect(() => new Base36(36)).toThrow(RangeError)
	})
})
