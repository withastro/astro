export const ACTIONS_TYPES_FILE = 'actions.d.ts';

export const VIRTUAL_MODULE_ID = 'astro:actions';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

export const RESOLVED_NOOP_VIRTUAL_MODULE_ID = '\0astro-internal:actions-noop';

export const RUNTIME_VIRTUAL_MODULE_ID = 'astro-internal:actions-runtime';
export const RESOLVED_RUNTIME_VIRTUAL_MODULE_ID = '\0' + RUNTIME_VIRTUAL_MODULE_ID;

export const ENTRYPOINT_VIRTUAL_MODULE_ID = 'astro-internal:actions-entrypoint';
export const RESOLVED_ENTRYPOINT_VIRTUAL_MODULE_ID = '\0' + ENTRYPOINT_VIRTUAL_MODULE_ID;

export const RESOLVED_NOOP_ENTRYPOINT_VIRTUAL_MODULE_ID =
	'\0astro-internal:actions-entrypoint-noop';

export const CODEGEN_VIRTUAL_MODULE_ID = 'astro-internal:actions-codegen';
export const RESOLVED_CODEGEN_VIRTUAL_MODULE_ID = '\0' + CODEGEN_VIRTUAL_MODULE_ID;

export const ACTION_QUERY_PARAMS = {
	actionName: '_action',
	actionPayload: '_astroActionPayload',
};

export const ACTION_RPC_ROUTE_PATTERN = '/_actions/[...path]';
