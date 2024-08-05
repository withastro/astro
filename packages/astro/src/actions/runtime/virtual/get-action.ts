import type { ZodType } from 'zod';
import type { ActionAccept, ActionClient } from './server.js';

/**
 * Get server-side action based on the route path.
 * Imports from the virtual module `astro:internal-actions`, which maps to
 * the user's `src/actions/index.ts` file at build-time.
 */
export async function getAction(
	path: string
): Promise<ActionClient<unknown, ActionAccept, ZodType> | undefined> {
	const pathKeys = path.replace('/_actions/', '').split('.');
	// @ts-expect-error virtual module
	let { server: actionLookup } = await import('astro:internal-actions');

	for (const key of pathKeys) {
		if (!(key in actionLookup)) {
			return undefined;
		}
		actionLookup = actionLookup[key];
	}
	if (typeof actionLookup !== 'function') {
		return undefined;
	}
	return actionLookup;
}
