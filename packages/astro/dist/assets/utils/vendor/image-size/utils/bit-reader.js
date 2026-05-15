class BitReader {
	// Skip the first 16 bits (2 bytes) of signature
	byteOffset = 2;
	bitOffset = 0;
	input;
	endianness;
	constructor(input, endianness) {
		this.input = input;
		this.endianness = endianness;
	}
	/** Reads a specified number of bits, and move the offset */
	getBits(length = 1) {
		let result = 0;
		let bitsRead = 0;
		while (bitsRead < length) {
			if (this.byteOffset >= this.input.length) {
				throw new Error('Reached end of input');
			}
			const currentByte = this.input[this.byteOffset];
			const bitsLeft = 8 - this.bitOffset;
			const bitsToRead = Math.min(length - bitsRead, bitsLeft);
			if (this.endianness === 'little-endian') {
				const mask = (1 << bitsToRead) - 1;
				const bits = (currentByte >> this.bitOffset) & mask;
				result |= bits << bitsRead;
			} else {
				const mask = ((1 << bitsToRead) - 1) << (8 - this.bitOffset - bitsToRead);
				const bits = (currentByte & mask) >> (8 - this.bitOffset - bitsToRead);
				result = (result << bitsToRead) | bits;
			}
			bitsRead += bitsToRead;
			this.bitOffset += bitsToRead;
			if (this.bitOffset === 8) {
				this.byteOffset++;
				this.bitOffset = 0;
			}
		}
		return result;
	}
}
export { BitReader };
