import { readFileSync } from 'node:fs';

export const PACKAGE_NAME = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8')
).name;

export const INTERNAL_MOD_IMPORT = JSON.stringify(`${PACKAGE_NAME}/internal`);
export const DRIZZLE_MOD_IMPORT = JSON.stringify(`${PACKAGE_NAME}/internal-drizzle`);

export const SUPPORTED_SEED_FILES = ['db.seed.js', 'db.seed.mjs', 'db.seed.mts', 'db.seed.ts'];

export const DB_TYPES_FILE = 'db-types.d.ts';

export const VIRTUAL_MODULE_ID = 'astro:db';

// TODO: copy DB to build for serverless
export function getDbUrl(root: URL) {
	return new URL('.astro/content.db', root);
}
