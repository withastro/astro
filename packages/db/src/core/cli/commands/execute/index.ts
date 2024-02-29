import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { MISSING_EXECUTE_PATH_ERROR, FILE_NOT_FOUND_ERROR } from '../../../errors.js';
import { existsSync } from 'node:fs';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { type DBConfig } from '../../../types.js';
import { executeFile } from '../../../load-file.js';

export async function cmd({
	astroConfig,
	dbConfig,
	flags,
}: {
	astroConfig: AstroConfig;
	dbConfig: DBConfig;
	flags: Arguments;
}) {
	const filePath = flags._[4];
	if (typeof filePath !== 'string') {
		console.error(MISSING_EXECUTE_PATH_ERROR);
		process.exit(1);
	}

	const fileUrl = new URL(filePath, astroConfig.root);
	if (!existsSync(fileUrl)) {
		console.error(FILE_NOT_FOUND_ERROR(filePath));
		process.exit(1);
	}

	const appToken = await getManagedAppTokenOrExit(flags.token);

	await executeFile({
		connectToStudio: true,
		fileUrl,
		tables: dbConfig.tables ?? {},
		root: astroConfig.root,
		appToken: appToken.token,
	});
}
