import type { ZodType } from 'zod';
import { ActionNotFoundError } from '../../../core/errors/errors-data.js';
import { AstroError } from '../../../core/errors/errors.js';
import type { ActionAccept, ActionClient } from './server.js';

/**
 * Get server-side action based on the route path.
 * Imports from the virtual module `astro:internal-actions`, which maps to
 * the user's `src/actions/index.ts` file at build-time.
 */
export async function getAction(
	path: string,
): Promise<ActionClient<unknown, ActionAccept, ZodType>> {
	const pathKey = decodeURIComponent(path.replace("/_actions/", ""))
	// @ts-expect-error virtual module
	let { server: actionLookup } = await import('astro:internal-actions');

	if (actionLookup == null || !(typeof actionLookup === 'object')) {
		throw new TypeError(
			`Expected \`server\` export in actions file to be an object. Received ${typeof actionLookup}.`,
		);
	}
	if (!(pathKey in actionLookup)) {
    throw new AstroError({
      ...ActionNotFoundError,
      message: ActionNotFoundError.message(pathKey)
    })
  }
  actionLookup = actionLookup[pathKey];
	if (typeof actionLookup !== 'function') {
		throw new TypeError(
			`Expected handler for action ${pathKey} to be a function. Received ${typeof actionLookup}.`,
		);
	}
	return actionLookup;
}
