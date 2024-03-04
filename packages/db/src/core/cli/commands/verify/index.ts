import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { getManagedAppTokenOrExit } from '../../../tokens.js';
import type { DBConfig } from '../../../types.js';
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
	const appToken = await getManagedAppTokenOrExit(flags.token);
	const productionSnapshot = await getProductionCurrentSnapshot({ appToken: appToken.token });
	const currentSnapshot = createCurrentSnapshot(dbConfig);
	const { queries: migrationQueries } = await getMigrationQueries({
		oldSnapshot:
			JSON.stringify(productionSnapshot) !== '{}' ? productionSnapshot : createEmptySnapshot(),
		newSnapshot: currentSnapshot,
	});

	if (migrationQueries.length === 0) {
		console.log(`Database schema is up to date.`);
	} else {
		console.log(`Database schema is out of date.`);
		console.log(`Run 'astro db push' to push up your latest changes.`);
	}

	await appToken.destroy();
}
