import { readFileSync } from 'node:fs';
const PACKAGE_NAME = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).name;
const RUNTIME_IMPORT = JSON.stringify(`${PACKAGE_NAME}/runtime`);
const RUNTIME_VIRTUAL_IMPORT = JSON.stringify(`${PACKAGE_NAME}/dist/runtime/virtual.js`);
const VIRTUAL_MODULE_ID = 'astro:db';
const DB_PATH = '.astro/content.db';
const CONFIG_FILE_NAMES = ['config.ts', 'config.js', 'config.mts', 'config.mjs'];
const MIGRATION_VERSION = '2024-03-12';
const VIRTUAL_CLIENT_MODULE_ID = 'virtual:astro:db-client';
const DB_CLIENTS = {
	node: `${PACKAGE_NAME}/db-client/libsql-node.js`,
	web: `${PACKAGE_NAME}/db-client/libsql-web.js`,
	local: `${PACKAGE_NAME}/db-client/libsql-local.js`,
};
export {
	CONFIG_FILE_NAMES,
	DB_CLIENTS,
	DB_PATH,
	MIGRATION_VERSION,
	RUNTIME_IMPORT,
	RUNTIME_VIRTUAL_IMPORT,
	VIRTUAL_CLIENT_MODULE_ID,
	VIRTUAL_MODULE_ID,
};
