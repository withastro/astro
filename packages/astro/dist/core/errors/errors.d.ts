import type { $ZodError } from 'zod/v4/core';
interface ErrorProperties {
	title?: string;
	name: string;
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
	| 'AstroError'
	| 'AstroUserError'
	| 'CompilerError'
	| 'CSSError'
	| 'MarkdownError'
	| 'InternalError'
	| 'AggregateError';
export declare function isAstroError(e: unknown): e is AstroError;
export declare class AstroError extends Error {
	loc: ErrorLocation | undefined;
	title: string | undefined;
	hint: string | undefined;
	frame: string | undefined;
	type: ErrorTypes;
	constructor(props: ErrorProperties, options?: ErrorOptions);
	setLocation(location: ErrorLocation): void;
	setName(name: string): void;
	setMessage(message: string): void;
	setHint(hint: string): void;
	setFrame(source: string, location: ErrorLocation): void;
	static is(err: unknown): err is AstroError;
}
export declare class CompilerError extends AstroError {
	type: ErrorTypes;
	constructor(props: ErrorProperties, options?: ErrorOptions);
	static is(err: unknown): err is CompilerError;
}
export declare class CSSError extends AstroError {
	type: ErrorTypes;
	static is(err: unknown): err is CSSError;
}
export declare class MarkdownError extends AstroError {
	type: ErrorTypes;
	static is(err: unknown): err is MarkdownError;
}
export declare class InternalError extends AstroError {
	type: ErrorTypes;
	static is(err: unknown): err is InternalError;
}
export declare class AggregateError extends AstroError {
	type: ErrorTypes;
	errors: AstroError[];
	constructor(
		props: ErrorProperties & {
			errors: AstroError[];
		},
		options?: ErrorOptions,
	);
	static is(err: unknown): err is AggregateError;
}
/**
 * Check if an error is a ZodError from an AstroConfig validation.
 * Used to suppress formatting a ZodError if needed.
 */
export declare function isAstroConfigZodError(error: unknown): error is $ZodError;
/**
 * Track that a ZodError comes from an AstroConfig validation.
 */
export declare function trackAstroConfigZodError(error: $ZodError): void;
/**
 * Generic object representing an error with all possible data
 * Compatible with both Astro's and Vite's errors
 */
export interface ErrorWithMetadata {
	[name: string]: any;
	name: string;
	title?: string;
	type?: ErrorTypes;
	message: string;
	stack?: string;
	hint?: string;
	id?: string;
	frame?: string;
	plugin?: string;
	pluginCode?: string;
	fullCode?: string;
	loc?: {
		file?: string;
		line?: number;
		column?: number;
	};
	cause?: any;
}
/**
 * Special error that is exposed to users.
 * Compared to AstroError, it contains a subset of information.
 */
export declare class AstroUserError extends Error {
	type: ErrorTypes;
	/**
	 * A message that explains to the user how they can fix the error.
	 */
	hint: string | undefined;
	name: string;
	constructor(message: string, hint?: string);
	static is(err: unknown): err is AstroUserError;
}
export {};
