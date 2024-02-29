import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import {
	MISSING_EXECUTE_PATH_ERROR,
	FILE_NOT_FOUND_ERROR,
	UNSAFE_DISABLE_STUDIO_WARNING,
} from '../../../errors.js';
import { existsSync } from 'node:fs';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { tablesSchema } from '../../../types.js';
import { executeFile } from '../../../load-file.js';

export async function cmd({ config, flags }: { config: AstroConfig; flags: Arguments }) {
	const tables = tablesSchema.parse(config.db?.tables ?? {});

	const filePath = flags._[4];
	if (typeof filePath !== 'string') {
		console.error(MISSING_EXECUTE_PATH_ERROR);
		process.exit(1);
	}

	const fileUrl = new URL(filePath, config.root);
	if (!existsSync(fileUrl)) {
		console.error(FILE_NOT_FOUND_ERROR(filePath));
		process.exit(1);
	}

	if (config.db?.unsafeDisableStudio) {
		console.warn(UNSAFE_DISABLE_STUDIO_WARNING);
		await executeFile({
			connectToStudio: false,
			fileUrl,
			tables,
			root: config.root,
		});
		return;
	}
	const appToken = await getManagedAppTokenOrExit(flags.token);

	await executeFile({
		connectToStudio: true,
		fileUrl,
		tables,
		root: config.root,
		appToken: appToken.token,
	});
}
