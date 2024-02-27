import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import path from 'node:path';
import { MISSING_EXECUTE_PATH_ERROR, FILE_NOT_FOUND_ERROR } from '../../../errors.js';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { tablesSchema } from '../../../types.js';

export async function cmd({ config, flags }: { config: AstroConfig; flags: Arguments }) {
	const appToken = await getManagedAppTokenOrExit(flags.token);
	const tables = tablesSchema.parse(config.db?.tables ?? {});

	const filePath = flags._[4];
	if (typeof filePath !== 'string') {
		console.error(MISSING_EXECUTE_PATH_ERROR);
		process.exit(1);
	}

	const fileUrl = pathToFileURL(path.join(process.cwd(), filePath));
	if (!existsSync(fileUrl)) {
		console.error(FILE_NOT_FOUND_ERROR(filePath));
		process.exit(1);
	}

	const { executeFile } = await import('./load-file.js');
	await executeFile({ fileUrl, tables, appToken: appToken.token });
}
