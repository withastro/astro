import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import { type DBConfig, type DBSnapshot } from '../../../types.js';
import { getRemoteDatabaseUrl } from '../../../utils.js';
import {
	createCurrentSnapshot,
	createEmptySnapshot,
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
	const appToken = await getManagedAppTokenOrExit(flags.token);
	const productionSnapshot = await getProductionCurrentSnapshot({ appToken: appToken.token });
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const isFromScratch = isForceReset || JSON.stringify(productionSnapshot) === '{}';
	const { queries: migrationQueries } = await getMigrationQueries({
		oldSnapshot: isFromScratch ? createEmptySnapshot() : productionSnapshot,
		newSnapshot: currentSnapshot,
	});

	// // push the database schema
	if (migrationQueries.length === 0) {
		console.log('Database schema is up to date.');
	} else {
		console.log(`Database schema is out of date.`);
	}
	if (isDryRun) {
		console.log('Statements:', JSON.stringify(migrationQueries, undefined, 2));
	} else {
		console.log(`Pushing database schema updates...`);
		await pushSchema({
			statements: migrationQueries,
			appToken: appToken.token,
			isDryRun,
			currentSnapshot: currentSnapshot,
		});
	}
	// cleanup and exit
	await appToken.destroy();
	console.info('Push complete!');
}

async function pushSchema({
	statements,
	appToken,
	isDryRun,
	currentSnapshot,
}: {
	statements: string[];
	appToken: string;
	isDryRun: boolean;
	currentSnapshot: DBSnapshot;
}) {
	const requestBody = {
		snapshot: currentSnapshot,
		sql: statements,
		experimentalVersion: 1,
	};
	if (isDryRun) {
		console.info('[DRY RUN] Batch query:', JSON.stringify(requestBody, null, 2));
		return new Response(null, { status: 200 });
	}
	const url = new URL('/db/push', getRemoteDatabaseUrl());
	return await fetch(url, {
		method: 'POST',
		headers: new Headers({
			Authorization: `Bearer ${appToken}`,
		}),
		body: JSON.stringify(requestBody),
	});
}
