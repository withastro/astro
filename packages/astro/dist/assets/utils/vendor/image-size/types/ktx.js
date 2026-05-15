import { readUInt32LE, toUTF8String } from './utils.js';
const KTX = {
	validate: (input) => {
		const signature = toUTF8String(input, 1, 7);
		return ['KTX 11', 'KTX 20'].includes(signature);
	},
	calculate: (input) => {
		const type = input[5] === 49 ? 'ktx' : 'ktx2';
		const offset = type === 'ktx' ? 36 : 20;
		return {
			height: readUInt32LE(input, offset + 4),
			width: readUInt32LE(input, offset),
			type,
		};
	},
};
export { KTX };
