import { readUInt32LE } from './utils.js';
const DDS = {
	validate: (input) => readUInt32LE(input, 0) === 542327876,
	calculate: (input) => ({
		height: readUInt32LE(input, 12),
		width: readUInt32LE(input, 16),
	}),
};
export { DDS };
