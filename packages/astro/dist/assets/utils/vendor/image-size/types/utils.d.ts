export declare const toUTF8String: (input: Uint8Array, start?: number, end?: number) => string;
export declare const toHexString: (input: Uint8Array, start?: number, end?: number) => string;
export declare const readInt16LE: (input: Uint8Array, offset?: number) => number;
export declare const readUInt16BE: (input: Uint8Array, offset?: number) => number;
export declare const readUInt16LE: (input: Uint8Array, offset?: number) => number;
export declare const readUInt24LE: (input: Uint8Array, offset?: number) => number;
export declare const readInt32LE: (input: Uint8Array, offset?: number) => number;
export declare const readUInt32BE: (input: Uint8Array, offset?: number) => number;
export declare const readUInt32LE: (input: Uint8Array, offset?: number) => number;
export declare const readUInt64: (
	input: Uint8Array,
	offset: number,
	isBigEndian: boolean,
) => bigint;
export declare function readUInt(
	input: Uint8Array,
	bits: 16 | 32,
	offset?: number,
	isBigEndian?: boolean,
): number;
export declare function findBox(
	input: Uint8Array,
	boxName: string,
	currentOffset: number,
):
	| {
			name: string;
			offset: number;
			size: number;
	  }
	| undefined;
