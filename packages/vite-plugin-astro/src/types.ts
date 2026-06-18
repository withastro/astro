import type { TransformOptions } from '@astrojs/compiler-rs';
import type { ErrorProperties } from './errors.js';

export type PropagationHint = 'none' | 'self' | 'in-tree';

export interface ModuleInfo {
	id: string;
	meta?: Record<string, unknown>;
}

export type Transform = (filename: string, code: string) => string;

export interface CompilerError extends ErrorProperties {
	type: 'compiler';
	location: ErrorProperties['location'] & { file: string };
}

export interface CSSError extends ErrorProperties {
	type: 'css';
	kind: 'syntax' | 'unknown' | undefined;
}

export interface AggregateError {
	type: 'aggregate';
	errors: Array<CSSError>;
}

export type ErrorHandler = (error: CompilerError | AggregateError | CSSError) => Error;

export type ExposedTransformOptions = Omit<
	TransformOptions,
	'filename' | 'normalizedFilename' | 'preprocessedStyles' | 'resolvePath'
>;

export interface AstroPluginOptions {
	transformOptions: ExposedTransformOptions;
	transform?: Transform;
	handleError?: ErrorHandler;
}
