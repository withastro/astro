import { readUInt, readUInt64, toHexString, toUTF8String } from './utils.js';
const CONSTANTS = {
	TAG: {
		WIDTH: 256,
		HEIGHT: 257,
		COMPRESSION: 259,
	},
	TYPE: {
		SHORT: 3,
		LONG: 4,
		LONG8: 16,
	},
	ENTRY_SIZE: {
		STANDARD: 12,
		BIG: 20,
	},
	COUNT_SIZE: {
		STANDARD: 2,
		BIG: 8,
	},
};
function readIFD(input, { isBigEndian, isBigTiff }) {
	const ifdOffset = isBigTiff
		? Number(readUInt64(input, 8, isBigEndian))
		: readUInt(input, 32, 4, isBigEndian);
	const entryCountSize = isBigTiff ? CONSTANTS.COUNT_SIZE.BIG : CONSTANTS.COUNT_SIZE.STANDARD;
	return input.slice(ifdOffset + entryCountSize);
}
function readTagValue(input, type, offset, isBigEndian) {
	switch (type) {
		case CONSTANTS.TYPE.SHORT:
			return readUInt(input, 16, offset, isBigEndian);
		case CONSTANTS.TYPE.LONG:
			return readUInt(input, 32, offset, isBigEndian);
		case CONSTANTS.TYPE.LONG8: {
			const value = Number(readUInt64(input, offset, isBigEndian));
			if (value > Number.MAX_SAFE_INTEGER) {
				throw new TypeError('Value too large');
			}
			return value;
		}
		default:
			return 0;
	}
}
function nextTag(input, isBigTiff) {
	const entrySize = isBigTiff ? CONSTANTS.ENTRY_SIZE.BIG : CONSTANTS.ENTRY_SIZE.STANDARD;
	if (input.length > entrySize) {
		return input.slice(entrySize);
	}
}
function extractTags(input, { isBigEndian, isBigTiff }) {
	const tags = {};
	let temp = input;
	while (temp?.length) {
		const code = readUInt(temp, 16, 0, isBigEndian);
		const type = readUInt(temp, 16, 2, isBigEndian);
		const length = isBigTiff
			? Number(readUInt64(temp, 4, isBigEndian))
			: readUInt(temp, 32, 4, isBigEndian);
		if (code === 0) break;
		if (
			length === 1 &&
			(type === CONSTANTS.TYPE.SHORT ||
				type === CONSTANTS.TYPE.LONG ||
				(isBigTiff && type === CONSTANTS.TYPE.LONG8))
		) {
			const valueOffset = isBigTiff ? 12 : 8;
			tags[code] = readTagValue(temp, type, valueOffset, isBigEndian);
		}
		temp = nextTag(temp, isBigTiff);
	}
	return tags;
}
function determineFormat(input) {
	const signature = toUTF8String(input, 0, 2);
	const version = readUInt(input, 16, 2, signature === 'MM');
	return {
		isBigEndian: signature === 'MM',
		isBigTiff: version === 43,
	};
}
function validateBigTIFFHeader(input, isBigEndian) {
	const byteSize = readUInt(input, 16, 4, isBigEndian);
	const reserved = readUInt(input, 16, 6, isBigEndian);
	if (byteSize !== 8 || reserved !== 0) {
		throw new TypeError('Invalid BigTIFF header');
	}
}
const signatures = /* @__PURE__ */ new Set([
	'49492a00',
	// Little Endian
	'4d4d002a',
	// Big Endian
	'49492b00',
	// BigTIFF Little Endian
	'4d4d002b',
	// BigTIFF Big Endian
]);
const TIFF = {
	validate: (input) => {
		const signature = toHexString(input, 0, 4);
		return signatures.has(signature);
	},
	calculate(input) {
		const format = determineFormat(input);
		if (format.isBigTiff) {
			validateBigTIFFHeader(input, format.isBigEndian);
		}
		const ifdBuffer = readIFD(input, format);
		const tags = extractTags(ifdBuffer, format);
		const info = {
			height: tags[CONSTANTS.TAG.HEIGHT],
			width: tags[CONSTANTS.TAG.WIDTH],
			type: format.isBigTiff ? 'bigtiff' : 'tiff',
		};
		if (tags[CONSTANTS.TAG.COMPRESSION]) {
			info.compression = tags[CONSTANTS.TAG.COMPRESSION];
		}
		if (!info.width || !info.height) {
			throw new TypeError('Invalid Tiff. Missing tags');
		}
		return info;
	},
};
export { TIFF };
