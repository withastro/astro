import { red } from 'kleur/colors';
import { astroConfigWithDbSchema } from '../config.js';
import { errorMap } from '../error-map.js';
import { loadAstroConfig } from '../load-astro-config.js';

export async function cli(command: string, _args: string[] = []) {
	switch (command) {
		case 'sync': {
			const { sync } = await import('./sync/index.js');
			const astroConfig = await getAstroConfigOrExit();

			const collections = astroConfig.db?.collections ?? {};

			return await sync({ collections });
		}
		default: {
			// eslint-disable-next-line no-console
			console.error(`Unknown command: ${command}`);
			return;
		}
	}
}

async function getAstroConfigOrExit(root: string = process.cwd()) {
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
