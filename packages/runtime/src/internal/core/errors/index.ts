export type { ErrorWithMetadata } from './errors.js';
export {
	AggregateError,
	AstroError,
	AstroUserError,
	CompilerError,
	CSSError,
	isAstroError,
	MarkdownError,
} from './errors.js';
export * as AstroErrorData from './errors-data.js';
export { createSafeError, positionAt } from './utils.js';
export { errorMap } from './zod-error-map.js';
