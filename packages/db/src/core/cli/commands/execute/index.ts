import { existsSync } from 'node:fs';
import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { FILE_NOT_FOUND_ERROR, MISSING_EXECUTE_PATH_ERROR } from '../../../errors.js';
import { getStudioVirtualModContents } from '../../../integration/vite-plugin-db.js';
import { bundleFile, importBundledFile } from '../../../load-file.js';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { type DBConfig } from '../../../types.js';

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

	const virtualModContents = getStudioVirtualModContents({
		tables: dbConfig.tables ?? {},
		appToken: appToken.token,
	});
	const { code } = await bundleFile({ virtualModContents, root: astroConfig.root, fileUrl });
	// Executable files use top-level await. Importing will run the file.
	await importBundledFile({ code, root: astroConfig.root });
}
