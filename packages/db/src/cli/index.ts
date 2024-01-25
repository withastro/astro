import type { AstroConfig } from 'astro';
import type { Arguments } from 'yargs-parser';

export async function cli({ flags, config }: { flags: Arguments; config: AstroConfig }) {
	const command = flags._[3] as string;

	switch (command) {
		case 'sync': {
			const { cmd: syncCommand } = await import('./commands/sync/index.js');
			return await syncCommand({ config, flags });
		}
		case 'push': {
			const { cmd: pushCommand } = await import('./commands/push/index.js');
			return await pushCommand({ config, flags });
		}
		case 'verify': {
			const { cmd: verifyCommand } = await import('./commands/verify/index.js');
			return await verifyCommand({ config, flags });
		}
		default: {
			if (command == null) {
				// eslint-disable-next-line no-console
				console.error(`No command provided.

${showHelp()}`);
			} else {
				// eslint-disable-next-line no-console
				console.error(`Unknown command: ${command}

${showHelp()}`);
			}
			return;
		}
	}

	function showHelp() {
		return `astro db <command>
		
Usage:

astro db sync        Creates snapshot based on your schema
astro db push        Pushes migrations to Astro Studio
astro db verify      Verifies migrations have been pushed and errors if not`;
	}
}
