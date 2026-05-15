import { readUInt32BE } from './utils.js';
const J2C = {
	// TODO: this doesn't seem right. SIZ marker doesn't have to be right after the SOC
	validate: (input) => readUInt32BE(input, 0) === 4283432785,
	calculate: (input) => ({
		height: readUInt32BE(input, 12),
		width: readUInt32BE(input, 8),
	}),
};
export { J2C };
