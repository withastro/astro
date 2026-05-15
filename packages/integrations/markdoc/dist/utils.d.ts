import type { ComponentConfig } from './config.js';
/**
 * Matches AstroError object with types like error codes stubbed out
 * @see 'astro/src/core/errors/errors.ts'
 */
export declare class MarkdocError extends Error {
	loc: ErrorLocation | undefined;
	title: string | undefined;
	hint: string | undefined;
	frame: string | undefined;
	type: string;
	constructor(props: ErrorProperties, ...params: any);
}
interface ErrorLocation {
	file?: string;
	line?: number;
	column?: number;
}
interface ErrorProperties {
	code?: number;
	title?: string;
	name?: string;
	message?: string;
	location?: ErrorLocation;
	hint?: string;
	stack?: string;
	frame?: string;
}
/**
 * @see 'astro/src/core/path.ts'
 */
export declare function prependForwardSlash(str: string): string;
export declare function isValidUrl(str: string): boolean;
/** Identifier for components imports passed as `tags` or `nodes` configuration. */
export declare const componentConfigSymbol: unique symbol;
export declare function isComponentConfig(value: unknown): value is ComponentConfig;
export {};
