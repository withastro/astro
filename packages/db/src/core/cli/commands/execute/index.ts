import { existsSync } from 'node:fs';
import { LibsqlError } from '@libsql/client';
import type { AstroConfig } from 'astro';
import { green } from 'kleur/colors';
import type { Arguments } from 'yargs-parser';
import {
	EXEC_DEFAULT_EXPORT_ERROR,
	EXEC_ERROR,
	FILE_NOT_FOUND_ERROR,
	MISSING_EXECUTE_PATH_ERROR,
} from '../../../errors.js';
import {
	getLocalVirtualModContents,
	getStudioVirtualModContents,
} from '../../../integration/vite-plugin-db.js';
import { bundleFile, importBundledFile } from '../../../load-file.js';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { type DBConfig, type DBTables } from '../../../types.js';
import { AstroDbError } from '../../../../runtime/utils.js';
import { fileURLToPath } from 'node:url';

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

	let virtualModContents: string;
	if (flags.remote) {
		const appToken = await getManagedAppTokenOrExit(flags.token);
		virtualModContents = getStudioVirtualModContents({
			tables: dbConfig.tables ?? {},
			appToken: appToken.token,
			isBuild: false,
			output: 'server',
		});
	} else {
		virtualModContents = getLocalVirtualModContents({
			tables: dbConfig.tables ?? {},
			root: astroConfig.root,
		});
	}
	const { code } = await bundleFile({ virtualModContents, root: astroConfig.root, fileUrl });

	const mod = await importBundledFile({ code, root: astroConfig.root });
	if (typeof mod.default !== 'function') {
		console.error(EXEC_DEFAULT_EXPORT_ERROR(filePath));
		process.exit(1);
	}
	try {
		await mod.default();
		console.info(`${green('✔')} File run successfully.`);
	} catch (e) {
		if (e instanceof LibsqlError) {
			throw new Error(EXEC_ERROR(e.message));
		}
		throw e;
	}
}

export async function executeSeedFile({
	tables,
	root,
	fileUrl,
}: {
	tables: DBTables;
	root: URL;
	fileUrl: URL;
}) {
	const virtualModContents = getLocalVirtualModContents({
		tables: tables ?? {},
		root,
	});
	const { code } = await bundleFile({ virtualModContents, root, fileUrl });
	const mod = await importBundledFile({ code, root });
	if (typeof mod.default !== 'function') {
		// TODO: format error
		throw new AstroDbError(EXEC_DEFAULT_EXPORT_ERROR(fileURLToPath(fileUrl)));
	}
	try {
		await mod.default();
	} catch (e) {
		if (e instanceof LibsqlError) {
			throw new AstroDbError(EXEC_ERROR(e.message));
		}
		throw e;
	}
}
