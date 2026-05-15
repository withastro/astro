import { normalizeLF } from './utils.js';
function codeFrame(src, loc) {
	if (!loc || loc.line === void 0 || loc.column === void 0) {
		return '';
	}
	const lines = normalizeLF(src)
		.split('\n')
		.map((ln) => ln.replace(/\t/g, '  '));
	const visibleLines = [];
	for (let n = -2; n <= 2; n++) {
		if (lines[loc.line + n]) visibleLines.push(loc.line + n);
	}
	let gutterWidth = 0;
	for (const lineNo of visibleLines) {
		let w = `> ${lineNo}`;
		if (w.length > gutterWidth) gutterWidth = w.length;
	}
	let output = '';
	for (const lineNo of visibleLines) {
		const isFocusedLine = lineNo === loc.line - 1;
		output += isFocusedLine ? '> ' : '  ';
		output += `${lineNo + 1} | ${lines[lineNo]}
`;
		if (isFocusedLine)
			output += `${Array.from({ length: gutterWidth }).join(' ')}  | ${Array.from({
				length: loc.column,
			}).join(' ')}^
`;
	}
	return output;
}
export { codeFrame };
