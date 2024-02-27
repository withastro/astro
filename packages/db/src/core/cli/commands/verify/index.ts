import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import {
	getMigrationStatus,
	MIGRATION_NEEDED,
	MIGRATIONS_NOT_INITIALIZED,
	MIGRATIONS_UP_TO_DATE,
} from '../../migrations.js';
import { getMigrationQueries } from '../../migration-queries.js';

export async function cmd({ config, flags }: { config: AstroConfig; flags: Arguments }) {
	const status = await getMigrationStatus(config);
	const { state } = status;
	if (flags.json) {
		if (state === 'ahead') {
			const { queries: migrationQueries } = await getMigrationQueries({
				oldSnapshot: status.oldSnapshot,
				newSnapshot: status.newSnapshot,
			});
			const newFileContent = {
				diff: status.diff,
				db: migrationQueries,
			};
			status.newFileContent = JSON.stringify(newFileContent, null, 2);
		}
		console.log(JSON.stringify(status));
		process.exit(state === 'up-to-date' ? 0 : 1);
	}
	switch (state) {
		case 'no-migrations-found': {
			console.log(MIGRATIONS_NOT_INITIALIZED);
			process.exit(1);
		}
		case 'ahead': {
			console.log(MIGRATION_NEEDED);
			process.exit(1);
		}
		case 'up-to-date': {
			console.log(MIGRATIONS_UP_TO_DATE);
			return;
		}
	}
}
