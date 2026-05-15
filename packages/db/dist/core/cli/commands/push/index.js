import * as clack from '@clack/prompts';
import { sql } from 'drizzle-orm';
import { MIGRATION_VERSION } from '../../../consts.js';
import { createClient } from '../../../db-client/libsql-node.js';
import { getRemoteDatabaseInfo, resolveDbAppToken } from '../../../utils.js';
import {
	createCurrentSnapshot,
	createEmptySnapshot,
	formatDataLossMessage,
	getMigrationQueries,
	getProductionCurrentSnapshot,
} from '../../migration-queries.js';
async function cmd({ dbConfig, flags }) {
	const isDryRun = flags.dryRun;
	const isForceReset = flags.forceReset;
	const dbInfo = getRemoteDatabaseInfo();
	const appToken = resolveDbAppToken(flags, dbInfo.token);
	const productionSnapshot = await getProductionCurrentSnapshot({ ...dbInfo, token: appToken });
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const isFromScratch = !productionSnapshot;
	const { queries: migrationQueries, confirmations } = await getMigrationQueries({
		oldSnapshot: isFromScratch ? createEmptySnapshot() : productionSnapshot,
		newSnapshot: currentSnapshot,
		reset: isForceReset,
	});
	if (migrationQueries.length === 0) {
		console.log('Database schema is up to date.');
	} else {
		console.log(`Database schema is out of date.`);
	}
	if (isForceReset) {
		const begin = await clack.confirm({
			message: `Reset your database? All of your data will be erased and your schema created from scratch.`,
			initialValue: false,
			withGuide: false,
		});
		if (begin !== true) {
			console.log('Canceled.');
			process.exit(0);
		}
		console.log(`Force-pushing to the database. All existing data will be erased.`);
	} else if (confirmations.length > 0) {
		console.log('\n' + formatDataLossMessage(confirmations) + '\n');
		throw new Error('Exiting.');
	}
	if (isDryRun) {
		console.log('Statements:', JSON.stringify(migrationQueries, void 0, 2));
	} else {
		console.log(`Pushing database schema updates...`);
		await pushSchema({
			statements: migrationQueries,
			dbInfo,
			appToken,
			isDryRun,
			currentSnapshot,
		});
	}
	console.info('Push complete!');
}
async function pushSchema({ statements, dbInfo, appToken, isDryRun, currentSnapshot }) {
	const requestBody = {
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
async function pushToDb(requestBody, appToken, remoteUrl) {
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
export { cmd };
