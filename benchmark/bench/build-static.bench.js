import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { bench, describe } from 'vitest';

const staticRoot = fileURLToPath(new URL('../static-projects/build-static', import.meta.url));

describe('Bench build time', () => {
	bench(
		'Build: full static site',
		async () => {
			await build({
				root: staticRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);
});
