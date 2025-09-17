import { readFileSync } from 'node:fs';

const PACKAGE_NAME = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).name;

export const RUNTIME_IMPORT = JSON.stringify(`${PACKAGE_NAME}/runtime`);

export const RUNTIME_VIRTUAL_IMPORT = JSON.stringify(`${PACKAGE_NAME}/dist/runtime/virtual.js`);

export const VIRTUAL_MODULE_ID = 'astro:db';

export const DB_PATH = '.astro/content.db';

export const CONFIG_FILE_NAMES = ['config.ts', 'config.js', 'config.mts', 'config.mjs'];

export const MIGRATION_VERSION = '2024-03-12';

export const VIRTUAL_CLIENT_MODULE_ID = 'virtual:astro:db-client';

export const DB_CLIENTS = {
	node: `${PACKAGE_NAME}/db-client/libsql-node.js`,
	web: `${PACKAGE_NAME}/db-client/libsql-web.js`,
	local: `${PACKAGE_NAME}/db-client/libsql-local.js`,
};
