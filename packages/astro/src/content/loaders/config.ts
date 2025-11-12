import type { ZodSchema } from 'zod';
import type { Loader } from './types.js';

export function defineContentLoader<T extends ZodSchema>(loader: Loader<T>) {
	return loader;
}
