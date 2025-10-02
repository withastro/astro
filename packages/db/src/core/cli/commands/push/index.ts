import type { AstroConfig } from 'astro';
import { sql } from 'drizzle-orm';
import prompts from 'prompts';
import type { Arguments } from 'yargs-parser';
import { MIGRATION_VERSION } from '../../../consts.js';
import { createClient } from '../../../db-client/libsql-node.js';
import type { DBConfig, DBSnapshot } from '../../../types.js';
import { getRemoteDatabaseInfo, type RemoteDatabaseInfo } from '../../../utils.js';
import {
	createCurrentSnapshot,
	createEmptySnapshot,
	formatDataLossMessage,
	getMigrationQueries,
	getProductionCurrentSnapshot,
} from '../../migration-queries.js';

export async function cmd({
	dbConfig,
	flags,
}: {
	astroConfig: AstroConfig;
	dbConfig: DBConfig;
	flags: Arguments;
}) {
	const isDryRun = flags.dryRun;
	const isForceReset = flags.forceReset;
	const dbInfo = getRemoteDatabaseInfo();
	const productionSnapshot = await getProductionCurrentSnapshot(dbInfo);
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const isFromScratch = !productionSnapshot;
	const { queries: migrationQueries, confirmations } = await getMigrationQueries({
		oldSnapshot: isFromScratch ? createEmptySnapshot() : productionSnapshot,
		newSnapshot: currentSnapshot,
		reset: isForceReset,
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
			statements: migrationQueries,
			dbInfo,
			appToken: flags.token ?? dbInfo.token,
			isDryRun,
			currentSnapshot: currentSnapshot,
		});
	}
	console.info('Push complete!');
}

async function pushSchema({
	statements,
	dbInfo,
	appToken,
	isDryRun,
	currentSnapshot,
}: {
	statements: string[];
	dbInfo: RemoteDatabaseInfo;
	appToken: string;
	isDryRun: boolean;
	currentSnapshot: DBSnapshot;
}) {
	const requestBody: RequestBody = {
		snapshot: currentSnapshot,
		sql: statements,
		version: MIGRATION_VERSION,
	};
	if (isDryRun) {
		console.info('[DRY RUN] Batch query:', JSON.stringify(requestBody, null, 2));
		return new Response(null, { status: 200 });
	}

	return pushToDb(requestBody, appToken, dbInfo.url);
}

type RequestBody = {
	snapshot: DBSnapshot;
	sql: string[];
	version: string;
};

async function pushToDb(requestBody: RequestBody, appToken: string, remoteUrl: string) {
	const client = createClient({
		token: appToken,
		url: remoteUrl,
	});

	await client.run(sql`create table if not exists _astro_db_snapshot (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		version TEXT,
		snapshot BLOB
	);`);

	await client.transaction(async (tx) => {
		for (const stmt of requestBody.sql) {
			await tx.run(sql.raw(stmt));
		}

		await tx.run(sql`insert into _astro_db_snapshot (version, snapshot) values (
			${requestBody.version},
			${JSON.stringify(requestBody.snapshot)}
		)`);
	});
}
