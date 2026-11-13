export const CLIENT_VIRTUAL_MODULE_ID = 'astro:env/client';
export const RESOLVED_CLIENT_VIRTUAL_MODULE_ID = '\0' + CLIENT_VIRTUAL_MODULE_ID;

export const SERVER_VIRTUAL_MODULE_ID = 'astro:env/server';
export const RESOLVED_SERVER_VIRTUAL_MODULE_ID = '\0' + SERVER_VIRTUAL_MODULE_ID;

/** Used to serialize the schema */
export const INTERNAL_VIRTUAL_MODULE_ID = 'virtual:astro:env/internal';
export const RESOLVED_INTERNAL_VIRTUAL_MODULE_ID = '\0' + INTERNAL_VIRTUAL_MODULE_ID;

export const ENV_TYPES_FILE = 'env.d.ts';

const PKG_BASE = new URL('../../', import.meta.url);
export const MODULE_TEMPLATE_URL = new URL('templates/env.mjs', PKG_BASE);
