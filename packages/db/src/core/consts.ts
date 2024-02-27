import { readFileSync } from 'node:fs';

export const PACKAGE_NAME = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
).name;

export const RUNTIME_IMPORT = JSON.stringify(`${PACKAGE_NAME}/runtime`);
export const RUNTIME_DRIZZLE_IMPORT = JSON.stringify(`${PACKAGE_NAME}/runtime/drizzle`);

export const DB_TYPES_FILE = 'db-types.d.ts';

export const VIRTUAL_MODULE_ID = 'astro:db';

export const DB_PATH = '.astro/content.db';

export const SEED_DEV_FILE_NAMES = [
	'seed.ts',
	'seed.js',
	'seed.mjs',
	'seed.mts',
	'seed.dev.ts',
	'seed.dev.js',
	'seed.dev.mjs',
	'seed.dev.mts',
	'seed.development.ts',
	'seed.development.js',
	'seed.development.mjs',
	'seed.development.mts',
];
