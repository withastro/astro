import type { $ZodError } from 'zod/v4/core';

export * from '@astrojs/runtime/internal/core/errors/errors.js';

const astroConfigZodErrors = new WeakSet<$ZodError>();

/**
 * Check if an error is a ZodError from an AstroConfig validation.
 * Used to suppress formatting a ZodError if needed.
 */
export function isAstroConfigZodError(error: unknown): error is $ZodError {
	return astroConfigZodErrors.has(error as $ZodError);
}

/**
 * Track that a ZodError comes from an AstroConfig validation.
 */
export function trackAstroConfigZodError(error: $ZodError): void {
	astroConfigZodErrors.add(error);
}
