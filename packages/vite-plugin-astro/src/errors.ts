import type { ErrorHandler } from './types.js';

export interface ErrorLocation {
	file: string | undefined;
	line: number | undefined;
	column: number | undefined;
}

export interface ErrorProperties {
	name: string | undefined;
	title: string | undefined;
	message: string | undefined;
	location: ErrorLocation | undefined;
	hint: string | undefined;
	stack: string | undefined;
	frame: string | undefined;
}

/**
 * Get the line and character based on the offset
 */
export function positionAt(offset: number, text: string): { line: number; column: number } {
	const lineOffsets = getLineOffsets(text);
	offset = Math.max(0, Math.min(text.length, offset));

	let low = 0;
	let high = lineOffsets.length;
	if (high === 0) {
		return { line: 0, column: offset };
	}

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const lineOffset = lineOffsets[mid];
		if (lineOffset === offset) {
			return { line: mid, column: 0 };
		} else if (offset > lineOffset) {
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}

	const line = low - 1;
	return { line, column: offset - lineOffsets[line] };
}

function getLineOffsets(text: string) {
	const lineOffsets: number[] = [];
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

function createError(
	{ message, name, stack, ...cause }: ErrorProperties,
	fallbackName: string,
): Error {
	const err = new Error(message, { cause });
	err.name = name ?? fallbackName;
	if (stack) err.stack = stack;
	return err;
}

export const defaultErrorHandler: ErrorHandler = (error) => {
	switch (error.type) {
		case 'compiler': {
			const { type, ...rest } = error;
			return createError(rest, 'CompilerError');
		}
		case 'css': {
			const { type, kind, ...rest } = error;
			return createError(
				rest,
				kind === undefined ? 'CSSError' : kind === 'syntax' ? 'CSSSyntaxError' : 'CSSUnknownError',
			);
		}
		case 'aggregate': {
			return new AggregateError(error.errors.map((err) => createError(err, 'CSSError')));
		}
	}
};
