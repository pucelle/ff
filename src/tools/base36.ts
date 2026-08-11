const Base36Radix = 36n


/** Pack numeric values into a Base36 string. */
export class Base36 {

	/** Exclusive upper bound of every numeric value. */
	readonly valueRadix: number

	/** Number of numeric values encoded in each chunk. */
	readonly valuesPerChunk: number

	/** Number of Base36 characters emitted for each chunk. */
	readonly charactersPerChunk: number

	private readonly bigintValueRadix: bigint

	constructor(valueRadix: number) {
		if (!Number.isInteger(valueRadix) || valueRadix < 2 || valueRadix >= Number(Base36Radix)) {
			throw new RangeError('"valueRadix" must be an integer between 2 and 35')
		}

		this.valueRadix = valueRadix
		this.bigintValueRadix = BigInt(valueRadix)

		let valuesPerChunk = 2
		let charactersPerChunk = 1

		while (this.bigintValueRadix ** BigInt(valuesPerChunk) > Base36Radix ** BigInt(charactersPerChunk)) {
			valuesPerChunk++
			charactersPerChunk++
		}

		this.valuesPerChunk = valuesPerChunk
		this.charactersPerChunk = charactersPerChunk
	}

	/** Encode values, padding an incomplete final chunk with zero values. */
	encode(values: readonly number[]): string {
		let encoded = ''

		for (let start = 0; start < values.length; start += this.valuesPerChunk) {
			let chunkValue = 0n

			for (let offset = 0; offset < this.valuesPerChunk; offset++) {
				let value = values[start + offset] ?? 0
				this.validateValue(value)
				chunkValue = chunkValue * this.bigintValueRadix + BigInt(value)
			}

			encoded += chunkValue.toString(36).padStart(this.charactersPerChunk, '0')
		}

		return encoded
	}

	/** Decode a string, including zero values added while padding its final chunk. */
	decode(encoded: string): number[] {
		if (encoded.length % this.charactersPerChunk !== 0) {
			throw new RangeError(`Encoded length must be a multiple of ${this.charactersPerChunk}`)
		}

		let values: number[] = []

		for (let start = 0; start < encoded.length; start += this.charactersPerChunk) {
			let chunkText = encoded.slice(start, start + this.charactersPerChunk)
			let chunkValue = this.parseChunk(chunkText)
			let chunkValues = new Array<number>(this.valuesPerChunk)

			for (let offset = this.valuesPerChunk - 1; offset >= 0; offset--) {
				chunkValues[offset] = Number(chunkValue % this.bigintValueRadix)
				chunkValue /= this.bigintValueRadix
			}

			if (chunkValue !== 0n) {
				throw new RangeError(`Encoded chunk "${chunkText}" is outside the value radix`)
			}

			values.push(...chunkValues)
		}

		return values
	}

	/** Return the encoded character length without building the encoded string. */
	getEncodedLength(valueCount: number): number {
		if (!Number.isSafeInteger(valueCount) || valueCount < 0) {
			throw new RangeError('"valueCount" must be a non-negative safe integer')
		}

		return Math.ceil(valueCount / this.valuesPerChunk) * this.charactersPerChunk
	}

	/** Return the padded decoded value count without decoding the string. */
	getDecodedLength(encodedLength: number): number {
		if (!Number.isSafeInteger(encodedLength) || encodedLength < 0) {
			throw new RangeError('"encodedLength" must be a non-negative safe integer')
		}

		if (encodedLength % this.charactersPerChunk !== 0) {
			throw new RangeError(`Encoded length must be a multiple of ${this.charactersPerChunk}`)
		}

		return encodedLength / this.charactersPerChunk * this.valuesPerChunk
	}

	private validateValue(value: number) {
		if (!Number.isInteger(value) || value < 0 || value >= this.valueRadix) {
			throw new RangeError(`Values must be integers between 0 and ${this.valueRadix - 1}`)
		}
	}

	private parseChunk(chunk: string): bigint {
		let value = 0n

		for (let character of chunk.toLowerCase()) {
			let digit = parseInt(character, 36)
			if (!Number.isInteger(digit)) {
				throw new RangeError(`"${character}" is not a Base36 character`)
			}

			value = value * Base36Radix + BigInt(digit)
		}

		return value
	}
}
