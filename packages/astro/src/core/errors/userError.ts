import { AstroError } from './errors.js';

export interface CreateAstroError {
	/**
	 * The cause of the error.
	 */
	message: string;
	/**
	 * An optional message that explain the user how they could fix the error.
	 */
	hint?: string;
}

export function createAstroError({ message, hint }: CreateAstroError): AstroError {
	return new AstroError({
		name: 'AstroError',
		message,
		hint,
	});
}
