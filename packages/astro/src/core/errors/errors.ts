import type { DiagnosticCode } from '@astrojs/compiler/shared/diagnostics.js';
import { AstroErrorCodes } from './errors-data.js';
import { codeFrame } from './printer.js';

interface ErrorProperties {
	errorCode: AstroErrorCodes | DiagnosticCode;
	name?: string;
	message?: string;
	location?: ErrorLocation;
	hint?: string;
	stack?: string;
	frame?: string;
}

export interface ErrorLocation {
	file?: string;
	line?: number;
	column?: number;
}

type ErrorTypes =
	| 'CSSError'
	| 'CompilerError'
	| 'RuntimeError'
	| 'MarkdownError'
	| 'AstroAggregateError';

export class AstroError extends Error {
	public errorCode: AstroErrorCodes | DiagnosticCode;
	public loc: ErrorLocation | undefined;
	public hint: string | undefined;
	public frame: string | undefined;

	type: ErrorTypes | undefined;

	constructor(props: ErrorProperties, ...params: any) {
		super(...params);

		const { errorCode, name, message, stack, location, hint, frame } = props;

		this.errorCode = errorCode;
		if (name) {
			this.name = name;
		} else {
			// If we don't have a name, let's generate one from the code
			this.name = AstroErrorCodes[errorCode];
		}
		if (message) this.message = message;
		// Only set this if we actually have a stack passed, otherwise uses Error's
		this.stack = stack ? stack : this.stack;
		this.loc = location;
		this.hint = hint;
		this.frame = frame;
	}

	public setErrorCode(errorCode: AstroErrorCodes | DiagnosticCode) {
		this.errorCode = errorCode;
		this.name = AstroErrorCodes[errorCode];
	}

	public setLocation(location: ErrorLocation): void {
		this.loc = location;
	}

	public setName(name: string): void {
		this.name = name;
	}

	public setMessage(message: string): void {
		this.message = message;
	}

	public setHint(hint: string): void {
		this.hint = hint;
	}

	public setFrame(source: string, location: ErrorLocation): void {
		this.frame = codeFrame(source, location);
	}
}

export class CSSError extends AstroError {
	type: ErrorTypes = 'CSSError';

	static is(err: Error | unknown): boolean {
		return (err as CSSError).type === 'CSSError';
	}
}

export class CompilerError extends AstroError {
	type: ErrorTypes = 'CompilerError';

	constructor(
		props: ErrorProperties & { errorCode: DiagnosticCode | AstroErrorCodes.UnknownCompilerError },
		...params: any
	) {
		super(props, ...params);

		this.name = 'CompilerError';
	}

	static is(err: Error | unknown): boolean {
		return (err as CompilerError).type === 'CompilerError';
	}
}

export class RuntimeError extends AstroError {
	type: ErrorTypes = 'RuntimeError';

	static is(err: Error | unknown): boolean {
		return (err as RuntimeError).type === 'RuntimeError';
	}
}

export class MarkdownError extends AstroError {
	type: ErrorTypes = 'MarkdownError';

	static is(err: Error | unknown): boolean {
		return (err as MarkdownError).type === 'MarkdownError';
	}
}

export class AggregateError extends AstroError {
	type: ErrorTypes = 'AstroAggregateError';
	errors: AstroError[];

	// Despite being a collection of errors, AggregateError still needs to have a main error attached to it
	// This is because Vite expects every thrown errors handled during HMR to be, well, Error and have a message
	constructor(props: ErrorProperties & { errors: AstroError[] }, ...params: any) {
		super(props, ...params);

		this.errors = props.errors;
	}

	static is(err: Error | unknown): boolean {
		return (err as AggregateError).type === 'AstroAggregateError';
	}
}

/**
 * Generic object representing an error with all possible data
 * Compatible with both Astro's and Vite's errors
 */
export interface ErrorWithMetadata {
	[name: string]: any;
	type?: ErrorTypes;
	message: string;
	stack: string;
	code?: number;
	hint?: string;
	id?: string;
	frame?: string;
	plugin?: string;
	pluginCode?: string;
	loc?: {
		file?: string;
		line?: number;
		column?: number;
	};
}
