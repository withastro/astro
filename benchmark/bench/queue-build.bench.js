import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { bench, describe } from 'vitest';

const queueBuildRoot = fileURLToPath(new URL('../static-projects/queue-build', import.meta.url));

describe('Bench queue-based build time', () => {
	bench(
		'Build: queue rendering static site',
		async () => {
			await build({
				root: queueBuildRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);
});
