/** This class helps read Uint8Array bit-by-bit */
export declare class BitReader {
	private byteOffset;
	private bitOffset;
	private readonly input;
	private readonly endianness;
	constructor(input: Uint8Array, endianness: 'big-endian' | 'little-endian');
	/** Reads a specified number of bits, and move the offset */
	getBits(length?: number): number;
}
