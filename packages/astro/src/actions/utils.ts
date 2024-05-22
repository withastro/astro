import type { APIContext } from '../@types/astro.js';
import { AstroError } from '../core/errors/errors.js';
import type { Locals } from './runtime/middleware.js';

export function hasActionsInternal(locals: APIContext['locals']): locals is Locals {
	return '_actionsInternal' in locals;
}

export function createGetActionResult(locals: APIContext['locals']): APIContext['getActionResult'] {
	return (actionFn) => {
		if (!hasActionsInternal(locals))
			throw new AstroError({
				name: 'AstroActionError',
				message: 'Experimental actions are not enabled in your project.',
				hint: 'See https://docs.astro.build/en/reference/configuration-reference/#experimental-flags',
			});

		return locals._actionsInternal.getActionResult(actionFn);
	};
}
