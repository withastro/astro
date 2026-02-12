import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { bench, describe } from 'vitest';

const hybridRoot = fileURLToPath(new URL('../static-projects/build-hybrid', import.meta.url));
const queueHybridRoot = fileURLToPath(
	new URL('../static-projects/queue-build-hybrid', import.meta.url),
);

describe('Bench build time', () => {
	bench(
		'Build: hybrid site (static + server)',
		async () => {
			await build({
				root: hybridRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);

	bench(
		'Queue Build: hybrid site (static + server)',
		async () => {
			await build({
				root: queueHybridRoot,
				logLevel: 'error',
			});
		},
		{ timeout: 300000, iterations: 3 },
	);
});
