import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { bench, describe } from 'vitest';

const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));
const queueServerRoot = fileURLToPath(
	new URL('../static-projects/queue-build-server', import.meta.url),
);

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
	bench(
		'Queue Build: full server site',
		async () => {
			await build({
				root: queueServerRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);
});
