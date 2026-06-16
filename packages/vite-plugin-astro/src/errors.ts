export interface ErrorLocation {
	file?: string;
	line?: number;
	column?: number;
}

interface ErrorProperties {
	name: string;
	title?: string;
	message?: string;
	location?: ErrorLocation;
	hint?: string;
	stack?: string;
	frame?: string;
}

export class CompilerError extends Error {
	public loc: ErrorLocation | undefined;
	public title: string | undefined;
	public hint: string | undefined;
	public frame: string | undefined;
	readonly type: string = 'CompilerError';

	constructor(props: ErrorProperties, options?: ErrorOptions) {
		const { name, title, message, stack, location, hint, frame } = props;
		super(message, options);
		this.name = name;
		this.title = title;
		if (message) this.message = message;
		this.stack = stack ?? this.stack;
		this.loc = location;
		this.hint = hint;
		this.frame = frame;
	}

	static is(err: unknown): err is CompilerError {
		return (err as CompilerError)?.type === 'CompilerError';
	}
}

export class CSSError extends Error {
	public loc: ErrorLocation | undefined;
	public title: string | undefined;
	public hint: string | undefined;
	public frame: string | undefined;
	readonly type: string = 'CSSError';

	constructor(props: ErrorProperties, options?: ErrorOptions) {
		const { name, title, message, stack, location, hint, frame } = props;
		super(message, options);
		this.name = name ?? 'CSSError';
		this.title = title;
		if (message) this.message = message;
		this.stack = stack ?? this.stack;
		this.loc = location;
		this.hint = hint;
		this.frame = frame;
	}

	static is(err: unknown): err is CSSError {
		return (err as CSSError)?.type === 'CSSError';
	}
}

export class AggregateError extends CompilerError {
	readonly type = 'AggregateError' as const;
	errors: CompilerError[];

	constructor(props: ErrorProperties & { errors: CompilerError[] }, options?: ErrorOptions) {
		super(props, options);
		this.errors = props.errors;
	}
}

export const ErrorData = {
	UnknownCompilerError: {
		name: 'UnknownCompilerError',
		title: 'Unknown compiler error.',
		hint: 'This is almost always a problem with the Astro compiler, not your code. Please open an issue at https://astro.build/issues/compiler.',
	},
	CSSSyntaxError: {
		name: 'CSSSyntaxError',
		title: 'CSS syntax error.',
	},
	UnknownCSSError: {
		name: 'UnknownCSSError',
		title: 'Unknown CSS error.',
	},
} as const;

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
