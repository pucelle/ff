export class BitReader {

	/** Get a bit reader from a base64 string. */
	static fromBase64(base64: string): BitReader {

		// Convert Uint8Array to a binary string.
		let binaryString = atob(base64)

		// Encode the binary string to buffer
		let buffer = new TextEncoder().encode(binaryString)

		return new BitReader(buffer)
	}

	private data: Uint8Array
	private byteIndex: number = 0
	private buffer: number = 0
	private bitCount: number = 0

	constructor(data: Uint8Array) {
		this.data = data
	}

	/** Reads the next 'bits' from the stream. */
	read(bits: number): number | null {

		// Top up the buffer until we have enough bits or run out of data.
		while (this.bitCount < bits) {
			if (this.byteIndex >= this.data.length) {

				// Out of data. If we need bits but have none left, return null (EOF).
				if (this.bitCount === 0) {
					return null
				}

				// Otherwise, yield whatever bits are left.
				bits = this.bitCount
				break
			}

			// Pull the next byte into the buffer.
			this.buffer = (this.buffer << 8) | this.data[this.byteIndex]

			this.byteIndex++
			this.bitCount += 8
		}

		// Extract the high bits from our buffer.
		this.bitCount -= bits
		let value = (this.buffer >> this.bitCount) & ((1 << bits) - 1)
		
		// Convert to unsigned to handle any 32-bit sign extension quirks.
		return value >>> 0
	}
}


export class BitWriter {
	private bytes: number[] = []
	private buffer: number = 0
	private bitCount: number = 0

	/** Writes the lowest 'bits' of 'value' to the stream. */
	write(value: number, bits: number) {

		// Mask the value to ensure it doesn't exceed the specified bit width.
		value &= (1 << bits) - 1

		// Shift existing buffer left and add the new bits.
		// Note: Using bitwise operations in JS/TS operates on 32-bit signed integers.
		this.buffer = (this.buffer << bits) | value
		this.bitCount += bits

		// While we have at least a full byte, extract and save it
		while (this.bitCount >= 8) {
			this.bitCount -= 8
			let byte = (this.buffer >> this.bitCount) & 0xff
			this.bytes.push(byte)
		}
	}

	/** Flushes any remaining bits in the buffer, padding the last byte with zeros. */
	flush(): Uint8Array {
		if (this.bitCount > 0) {

			// Shift left to align remaining bits to the most significant part of the byte
			let byte = (this.buffer << (8 - this.bitCount)) & 0xff

			this.bytes.push(byte)
			this.buffer = 0
			this.bitCount = 0
		}

		return new Uint8Array(this.bytes)
	}

	/** Convert to base64 string. */
	toBase64(): string {

		// Convert Uint8Array to a binary string.
		let binaryString = String.fromCharCode(...this.flush())

		// Encode the binary string to Base64
		return btoa(binaryString)
	}
}