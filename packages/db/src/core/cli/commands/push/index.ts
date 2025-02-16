import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import prompts from 'prompts';
import type { Arguments } from 'yargs-parser';
import { createRemoteDatabaseClient } from '../../../../runtime/index.js';
import { safeFetch } from '../../../../runtime/utils.js';
import { MIGRATION_VERSION } from '../../../consts.js';
import type { DBConfig, DBSnapshot } from '../../../types.js';
import {
	type RemoteDatabaseInfo,
	type Result,
	getManagedRemoteToken,
	getRemoteDatabaseInfo,
} from '../../../utils.js';
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
	const isDryRun = flags.dryRun;
	const isForceReset = flags.forceReset;
	const dbInfo = getRemoteDatabaseInfo();
	const appToken = await getManagedRemoteToken(flags.token, dbInfo);
	const productionSnapshot = await getProductionCurrentSnapshot({
		dbInfo,
		appToken: appToken.token,
	});
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const { queries: migrationQueries, confirmations } = await getMigrationOps({
		oldSnapshot: productionSnapshot ?? createEmptySnapshot(),
		newSnapshot: currentSnapshot,
		reset: isForceReset,
		backend,
	});

	// // push the database schema
	if (migrationQueries.length === 0) {
		console.log('Database schema is up to date.');
	} else {
		console.log(`Database schema is out of date.`);
	}

	if (isForceReset) {
		const { begin } = await prompts({
			type: 'confirm',
			name: 'begin',
			message: `Reset your database? All of your data will be erased and your schema created from scratch.`,
			initial: false,
		});

		if (!begin) {
			console.log('Canceled.');
			process.exit(0);
		}

		console.log(`Force-pushing to the database. All existing data will be erased.`);
	} else if (confirmations.length > 0) {
		console.log('\n' + formatDataLossMessage(confirmations) + '\n');
		throw new Error('Exiting.');
	}

	if (isDryRun) {
		console.log('Statements:', JSON.stringify(migrationQueries, undefined, 2));
	} else {
		console.log(`Pushing database schema updates...`);
		await pushSchema({
			operations: migrationQueries,
			isDryRun,
			currentSnapshot: currentSnapshot,
			backend,
		});
	}

	// cleanup and exit
	await appToken.destroy();
	console.info('Push complete!');
}

async function pushSchema<Op>({
	operations,
	isDryRun,
	currentSnapshot,
	backend,
}: {
	operations: Op[];
	isDryRun: boolean;
	currentSnapshot: DBSnapshot;
	backend: DatabaseBackend<any>;
}) {
	if (isDryRun) {
		const requestBody = {
			snapshot: currentSnapshot,
			operations,
			version: MIGRATION_VERSION,
		};

		console.info('[DRY RUN] Batch query:', JSON.stringify(requestBody, null, 2));
		return;
	}

	await backend.executeOps('remote', backend.getCreateSnapshotRegistryOps());

	await backend.executeOps('remote', [
		...operations,
		...backend.getStoreSnapshotOps(MIGRATION_VERSION, currentSnapshot)
	]);
}
