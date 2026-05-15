import { readUInt16LE, toUTF8String } from './utils.js';
const gifRegexp = /^GIF8[79]a/;
const GIF = {
	validate: (input) => gifRegexp.test(toUTF8String(input, 0, 6)),
	calculate: (input) => ({
		height: readUInt16LE(input, 8),
		width: readUInt16LE(input, 6),
	}),
};
export { GIF };
