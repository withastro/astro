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
			// eslint-disable-next-line no-console
			console.error(`Unknown command: ${command}`);
			return;
		}
	}
}
