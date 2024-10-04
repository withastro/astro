export const VIRTUAL_MODULE_ID = 'astro:link';
export const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID;

const PKG_BASE = new URL('../../', import.meta.url);
export const MODULE_TEMPLATE_URL = new URL('templates/typed-links/module.mjs', PKG_BASE);
export const TYPES_TEMPLATE_URL = new URL('templates/typed-links/types.d.ts', PKG_BASE);
export const TYPES_FILE = 'typed-links.d.ts';
