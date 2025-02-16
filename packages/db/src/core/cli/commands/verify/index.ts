import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import type { DBConfig } from '../../../types.js';
import { getManagedRemoteToken, getRemoteDatabaseInfo } from '../../../utils.js';
import {
	createCurrentSnapshot,
	createEmptySnapshot,
	formatDataLossMessage,
	getMigrationOps,
	getProductionCurrentSnapshot,
} from '../../migration-queries.js';
import type { DatabaseBackend } from '../../../backend/types.js';

export async function cmd({
	dbConfig,
	backend,
	flags,
}: {
	astroConfig: AstroConfig;
	dbConfig: DBConfig;
	backend: DatabaseBackend<any>;
	flags: Arguments;
}) {
	const isJson = flags.json;
	const dbInfo = getRemoteDatabaseInfo();
	const appToken = await getManagedRemoteToken(flags.token, dbInfo);
	const productionSnapshot = await getProductionCurrentSnapshot({
		dbInfo,
		appToken: appToken.token,
	});
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const { queries: migrationQueries, confirmations } = await getMigrationOps({
		oldSnapshot: productionSnapshot || createEmptySnapshot(),
		newSnapshot: currentSnapshot,
		backend,
	});

	const result = { exitCode: 0, message: '', code: '', data: undefined as unknown };
	if (migrationQueries.length === 0) {
		result.code = 'MATCH';
		result.message = `Database schema is up to date.`;
	} else {
		result.code = 'NO_MATCH';
		result.message = `Database schema is out of date.\nRun 'astro db push' to push up your latest changes.`;
	}

	if (confirmations.length > 0) {
		result.code = 'DATA_LOSS';
		result.exitCode = 1;
		result.data = confirmations;
		result.message = formatDataLossMessage(confirmations, !isJson);
	}

	if (isJson) {
		console.log(JSON.stringify(result));
	} else {
		console.log(result.message);
	}

	await appToken.destroy();
	process.exit(result.exitCode);
}
