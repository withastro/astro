#!/usr/bin/env node
import { red } from 'kleur/colors';
import { astroConfigWithDbSchema } from '../config.js';
import { errorMap } from '../error-map.js';
import { loadAstroConfig } from '../load-astro-config.js';
import type { AstroConfig } from 'astro';

async function main() {
	const cmd = process.argv[2];
	const config = await getAstroConfigOrExit();

	switch (cmd) {
		// Current
		case 'sync': {
			const { cmd: syncCommand } = await import('./commands/sync/index.js');
			return await syncCommand({ config });
		}
		case 'push': {
			const { cmd: pushCommand } = await import('./commands/push/index.js');
			return await pushCommand({ config });
		}
		case 'verify': {
			const { cmd: verifyCommand } = await import('./commands/verify/index.js');
			return await verifyCommand({ config });
		}
		// Legacy
		case 'deploy': {
			const { cmd: deployCommand } = await import('./commands/deploy/index.js');
			return await deployCommand();
		}
		case 'diff': {
			const { cmd: diffCommand } = await import('./commands/diff/index.js');
			return await diffCommand({ config });
		}
		case 'run': {
			const { cmd: runCommand } = await import('./commands/run/index.js');
			return await runCommand();
		}
		case 'shell': {
			const { cmd: shellCommand } = await import('./commands/shell/index.js');
			return await shellCommand();
		}
		case 'snapshot': {
			const { cmd: snapshotCommand } = await import('./commands/snapshot/index.js');
			return await snapshotCommand({ config });
		}
		default: {
			// eslint-disable-next-line no-console
			console.error(`Unknown command: ${cmd}`);
			return;
		}
	}
}

async function getAstroConfigOrExit(root: string = process.cwd()): Promise<Pick<AstroConfig, 'db'>> {
	const astroConfig = await loadAstroConfig(root);
	const parsed = astroConfigWithDbSchema.safeParse(astroConfig, { errorMap });
	if (parsed.success) {
		return parsed.data;
	}
	// eslint-disable-next-line no-console
	console.error(
		red('⚠️ Invalid studio config. Check your astro config file\n') +
			parsed.error.issues.map((i) => i.message).join('\n')
	);
	process.exit(0);
}

await main();
