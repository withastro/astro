import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { bench, describe } from 'vitest';

const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));

describe('Bench build time', () => {
	bench(
		'Build: full server site',
		async () => {
			await build({
				root: serverRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);
});
