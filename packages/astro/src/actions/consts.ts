export const VIRTUAL_MODULE_ID = 'astro:actions';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;
export const ACTIONS_TYPES_FILE = 'astro/actions.d.ts';
export const VIRTUAL_INTERNAL_MODULE_ID = 'astro:internal-actions';
export const RESOLVED_VIRTUAL_INTERNAL_MODULE_ID = '\0astro:internal-actions';
export const NOOP_ACTIONS = '\0noop-actions';

export const ACTION_QUERY_PARAMS = {
	actionName: '_astroAction',
	actionPayload: '_astroActionPayload',
	actionRedirect: '_astroActionRedirect',
};

/**
 * Used to check whether actions are defined using `defineAction()`.
 * This makes actions non-breaking for users that have an `actions` file
 * but don't use Astro Actions.
 */
export const DEFINE_ACTION_KEY = Symbol.for('astro:action');
