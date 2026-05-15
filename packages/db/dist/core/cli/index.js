import { resolveDbConfig } from '../load-file.js';
import { printHelp } from './print-help.js';
async function cli({ flags, config: astroConfig }) {
	const args = flags._;
	const command = args[2] === 'db' ? args[3] : args[2];
	validateDbAppTokenFlag(command, flags);
	const { dbConfig } = await resolveDbConfig(astroConfig);
	switch (command) {
		case 'shell': {
			const { cmd } = await import('./commands/shell/index.js');
			return await cmd({ astroConfig, dbConfig, flags });
		}
		case 'gen': {
			console.log('"astro db gen" is no longer needed! Visit the docs for more information.');
			return;
		}
		case 'sync': {
			console.log('"astro db sync" is no longer needed! Visit the docs for more information.');
			return;
		}
		case 'push': {
			const { cmd } = await import('./commands/push/index.js');
			return await cmd({ astroConfig, dbConfig, flags });
		}
		case 'verify': {
			const { cmd } = await import('./commands/verify/index.js');
			return await cmd({ astroConfig, dbConfig, flags });
		}
		case 'execute': {
			const { cmd } = await import('./commands/execute/index.js');
			return await cmd({ astroConfig, dbConfig, flags });
		}
		default: {
			if (command != null) {
				console.error(`Unknown command: ${command}`);
			}
			printHelp({
				commandName: 'astro db',
				usage: '[command] [...flags]',
				headline: ' ',
				tables: {
					Commands: [
						['push', 'Push table schema updates to libSQL.'],
						['verify', 'Test schema updates with libSQL (good for CI).'],
						[
							'astro db execute <file-path>',
							'Execute a ts/js file using astro:db. Use --remote to connect to libSQL.',
						],
						[
							'astro db shell --query <sql-string>',
							'Execute a SQL string. Use --remote to connect to libSQL.',
						],
					],
				},
			});
			return;
		}
	}
}
function validateDbAppTokenFlag(command, flags) {
	if (command !== 'execute' && command !== 'push' && command !== 'verify' && command !== 'shell')
		return;
	const dbAppToken = flags.dbAppToken;
	if (dbAppToken == null) return;
	if (typeof dbAppToken !== 'string') {
		console.error(`Invalid value for --db-app-token; expected a string.`);
		process.exit(1);
	}
}
export { cli };
