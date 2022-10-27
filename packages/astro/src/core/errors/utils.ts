import stripAnsi from 'strip-ansi';
import type { SSRError } from '../../@types/astro.js';

export function collectInfoFromStacktrace(error: SSRError): SSRError {
	if (!error.stack) return error;

	// normalize error stack line-endings to \n
	error.stack = eol.lf(error.stack);
	const stackText = stripAnsi(error.stack);

	// Try to find possible location from stack if we don't have one
	if (!error.loc || (!error.loc.column && !error.loc.line)) {
		const possibleFilePath =
			error.loc?.file ||
			error.pluginCode ||
			error.id ||
			// TODO: this could be better, `src` might be something else
			stackText.split('\n').find((ln) => ln.includes('src') || ln.includes('node_modules'));
		const source = possibleFilePath?.replace(/^[^(]+\(([^)]+).*$/, '$1').replace(/^\s+at\s+/, '');

		const [file, line, column] = source?.split(':') ?? [];
		if (line && column) {
			error.loc = {
				file,
				line: Number.parseInt(line),
				column: Number.parseInt(column),
			};
		}
	}

	// Derive plugin from stack (if possible)
	if (!error.plugin) {
		error.plugin =
			/withastro\/astro\/packages\/integrations\/([\w-]+)/gim.exec(stackText)?.at(1) ||
			/(@astrojs\/[\w-]+)\/(server|client|index)/gim.exec(stackText)?.at(1) ||
			undefined;
	}

	// Normalize stack (remove `/@fs/` urls, etc)
	error.stack = cleanErrorStack(error.stack);

	return error;
}

function cleanErrorStack(stack: string) {
	return stack
		.split(/\n/g)
		.map((l) => l.replace(/\/@fs\//g, '/'))
		.join('\n');
}

/**
 * Get the line and character based on the offset
 * @param offset The index of the position
 * @param text The text for which the position should be retrived
 */
export function positionAt(
	offset: number,
	text: string
): {
	line: number;
	column: number;
} {
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

	// low is the least x for which the line offset is larger than the current offset
	// or array.length if no line offset is larger than the current offset
	const line = low - 1;
	return { line, column: offset - lineOffsets[line] };
}

function getLineOffsets(text: string) {
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
