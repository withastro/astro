import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';
import { STUDIO_CONFIG_MISSING_CLI_ERROR } from '../errors.js';

export async function cli({ flags, config }: { flags: Arguments; config: AstroConfig }) {
	const command = flags._[3] as string;

	if (!config.db?.studio) {
		console.log(STUDIO_CONFIG_MISSING_CLI_ERROR);
		process.exit(1);
	}

	switch (command) {
		case 'shell': {
			const { cmd } = await import('./commands/shell/index.js');
			return await cmd({ config, flags });
		}
		case 'sync': {
			const { cmd } = await import('./commands/sync/index.js');
			return await cmd({ config, flags });
		}
		case 'push': {
			const { cmd } = await import('./commands/push/index.js');
			return await cmd({ config, flags });
		}
		case 'verify': {
			const { cmd } = await import('./commands/verify/index.js');
			return await cmd({ config, flags });
		}
		case 'login': {
			const { cmd } = await import('./commands/login/index.js');
			return await cmd({ config, flags });
		}
		case 'logout': {
			const { cmd } = await import('./commands/logout/index.js');
			return await cmd({ config, flags });
		}
		case 'link': {
			const { cmd } = await import('./commands/link/index.js');
			return await cmd({ config, flags });
		}
		default: {
			if (command == null) {
				console.error(`No command provided.

${showHelp()}`);
			} else {
				console.error(`Unknown command: ${command}

${showHelp()}`);
			}
			return;
		}
	}

	function showHelp() {
		return `astro db <command>
		
Usage:

astro db login       Authenticate your machine with Astro Studio
astro db logout      End your authenticated session with Astro Studio
astro db link        Link this directory to an Astro Studio project

astro db sync        Creates snapshot based on your schema
astro db push        Pushes migrations to Astro Studio
astro db verify      Verifies migrations have been pushed and errors if not`;
	}
}
