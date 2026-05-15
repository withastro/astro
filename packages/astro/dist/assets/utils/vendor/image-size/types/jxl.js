import { JXLStream } from './jxl-stream.js';
import { findBox, toUTF8String } from './utils.js';
function extractCodestream(input) {
	const jxlcBox = findBox(input, 'jxlc', 0);
	if (jxlcBox) {
		return input.slice(jxlcBox.offset + 8, jxlcBox.offset + jxlcBox.size);
	}
	const partialStreams = extractPartialStreams(input);
	if (partialStreams.length > 0) {
		return concatenateCodestreams(partialStreams);
	}
	return void 0;
}
function extractPartialStreams(input) {
	const partialStreams = [];
	let offset = 0;
	while (offset < input.length) {
		const jxlpBox = findBox(input, 'jxlp', offset);
		if (!jxlpBox) break;
		partialStreams.push(input.slice(jxlpBox.offset + 12, jxlpBox.offset + jxlpBox.size));
		offset = jxlpBox.offset + jxlpBox.size;
	}
	return partialStreams;
}
function concatenateCodestreams(partialCodestreams) {
	const totalLength = partialCodestreams.reduce((acc, curr) => acc + curr.length, 0);
	const codestream = new Uint8Array(totalLength);
	let position = 0;
	for (const partial of partialCodestreams) {
		codestream.set(partial, position);
		position += partial.length;
	}
	return codestream;
}
const JXL = {
	validate: (input) => {
		const boxType = toUTF8String(input, 4, 8);
		if (boxType !== 'JXL ') return false;
		const ftypBox = findBox(input, 'ftyp', 0);
		if (!ftypBox) return false;
		const brand = toUTF8String(input, ftypBox.offset + 8, ftypBox.offset + 12);
		return brand === 'jxl ';
	},
	calculate(input) {
		const codestream = extractCodestream(input);
		if (codestream) return JXLStream.calculate(codestream);
		throw new Error('No codestream found in JXL container');
	},
};
export { JXL };
