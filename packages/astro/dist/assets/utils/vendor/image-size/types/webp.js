import { readInt16LE, readUInt24LE, toHexString, toUTF8String } from './utils.js';
function calculateExtended(input) {
	return {
		height: 1 + readUInt24LE(input, 7),
		width: 1 + readUInt24LE(input, 4),
	};
}
function calculateLossless(input) {
	return {
		height: 1 + (((input[4] & 15) << 10) | (input[3] << 2) | ((input[2] & 192) >> 6)),
		width: 1 + (((input[2] & 63) << 8) | input[1]),
	};
}
function calculateLossy(input) {
	return {
		height: readInt16LE(input, 8) & 16383,
		width: readInt16LE(input, 6) & 16383,
	};
}
const WEBP = {
	validate(input) {
		const riffHeader = 'RIFF' === toUTF8String(input, 0, 4);
		const webpHeader = 'WEBP' === toUTF8String(input, 8, 12);
		const vp8Header = 'VP8' === toUTF8String(input, 12, 15);
		return riffHeader && webpHeader && vp8Header;
	},
	calculate(_input) {
		const chunkHeader = toUTF8String(_input, 12, 16);
		const input = _input.slice(20, 30);
		if (chunkHeader === 'VP8X') {
			const extendedHeader = input[0];
			const validStart = (extendedHeader & 192) === 0;
			const validEnd = (extendedHeader & 1) === 0;
			if (validStart && validEnd) {
				return calculateExtended(input);
			}
			throw new TypeError('Invalid WebP');
		}
		if (chunkHeader === 'VP8 ' && input[0] !== 47) {
			return calculateLossy(input);
		}
		const signature = toHexString(input, 3, 6);
		if (chunkHeader === 'VP8L' && signature !== '9d012a') {
			return calculateLossless(input);
		}
		throw new TypeError('Invalid WebP');
	},
};
export { WEBP };
