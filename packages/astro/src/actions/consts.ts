export const ACTIONS_TYPES_FILE = 'actions.d.ts';

export const VIRTUAL_MODULE_ID = 'astro:actions';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

/** Used to expose shared utilities, with server or client specific implementations */
export const RUNTIME_VIRTUAL_MODULE_ID = 'virtual:astro:actions/runtime';
export const RESOLVED_RUNTIME_VIRTUAL_MODULE_ID = '\0' + RUNTIME_VIRTUAL_MODULE_ID;

export const ENTRYPOINT_VIRTUAL_MODULE_ID = 'virtual:astro:actions/entrypoint';
export const RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID = '\0' + ENTRYPOINT_VIRTUAL_MODULE_ID;

/** Used to pass data from the config to the main virtual module */
export const OPTIONS_VIRTUAL_MODULE_ID = 'virtual:astro:actions/options';
export const RESOLVED_OPTIONS_VIRTUAL_MODULE_ID = '\0' + OPTIONS_VIRTUAL_MODULE_ID;

export const RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID = '\0virtual:astro:actions/noop-entrypoint';

export const ACTION_QUERY_PARAMS = {
	actionName: '_action',
	actionPayload: '_astroActionPayload',
};

export const ACTION_RPC_ROUTE_PATTERN = '/_actions/[...path]';
