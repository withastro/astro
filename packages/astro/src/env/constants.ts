export const VIRTUAL_CLIENT_MODULE_ID = 'astro:env/client';
export const RESOLVED_VIRTUAL_CLIENT_MODULE_ID = `\0${VIRTUAL_CLIENT_MODULE_ID}`;
export const VIRTUAL_SERVER_MODULE_ID = 'astro:env/server';
export const RESOLVED_VIRTUAL_SERVER_MODULE_ID = `\0${VIRTUAL_SERVER_MODULE_ID}`;
export const VIRTUAL_INTERNAL_MODULE_ID = 'virtual:astro:env/internal';
export const RESOLVED_VIRTUAL_INTERNAL_MODULE_ID = `\0${VIRTUAL_INTERNAL_MODULE_ID}`;

export const PUBLIC_PREFIX = 'PUBLIC_';
export const ENV_TYPES_FILE = 'astro-env.d.ts';

const PKG_BASE = new URL('../../', import.meta.url);
export const MODULE_TEMPLATE_URL = new URL('templates/env/module.mjs', PKG_BASE);
export const TYPES_TEMPLATE_URL = new URL('templates/env/types.d.ts', PKG_BASE);
