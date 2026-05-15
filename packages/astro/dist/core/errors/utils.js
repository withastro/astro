function positionAt(offset, text) {
	const lineOffsets = getLineOffsets(text);
	offset = Math.max(0, Math.min(text.length, offset));
	let low = 0;
	let high = lineOffsets.length;
	if (high === 0) {
		return {
			line: 0,
			column: offset,
		};
	}
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const lineOffset = lineOffsets[mid];
		if (lineOffset === offset) {
			return {
				line: mid,
				column: 0,
			};
		} else if (offset > lineOffset) {
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}
	const line = low - 1;
	return { line, column: offset - lineOffsets[line] };
}
function getLineOffsets(text) {
	const lineOffsets = [];
	let isLineStart = true;
	for (let i = 0; i < text.length; i++) {
		if (isLineStart) {
			lineOffsets.push(i);
			isLineStart = false;
		}
		const ch = text.charAt(i);
		isLineStart = ch === '\r' || ch === '\n';
		if (ch === '\r' && i + 1 < text.length && text.charAt(i + 1) === '\n') {
			i++;
		}
	}
	if (isLineStart && text.length > 0) {
		lineOffsets.push(text.length);
	}
	return lineOffsets;
}
function isYAMLException(err) {
	return err instanceof Error && err.name === 'YAMLException';
}
function formatYAMLException(e) {
	return {
		name: e.name,
		id: e.mark.name,
		loc: { file: e.mark.name, line: e.mark.line + 1, column: e.mark.column },
		message: e.reason,
		stack: e.stack ?? '',
	};
}
function isTOMLError(err) {
	return err instanceof Error && err.name === 'TomlError';
}
function formatTOMLError(e) {
	return {
		name: e.name,
		id: e.name,
		loc: { line: e.line + 1, column: e.column },
		message: e.message,
		stack: e.stack ?? '',
	};
}
function createSafeError(err) {
	if (err instanceof Error || (err?.name && err.message)) {
		return err;
	} else {
		const error = new Error(JSON.stringify(err));
		error.hint = `To get as much information as possible from your errors, make sure to throw Error objects instead of \`${typeof err}\`. See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error for more information.`;
		return error;
	}
}
function normalizeLF(code) {
	return code.replace(/\r\n|\r(?!\n)|\n/g, '\n');
}
export {
	createSafeError,
	formatTOMLError,
	formatYAMLException,
	isTOMLError,
	isYAMLException,
	normalizeLF,
	positionAt,
};
