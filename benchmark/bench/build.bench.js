import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { bench, describe } from 'vitest';

const staticRoot = fileURLToPath(new URL('../static-projects/build-static', import.meta.url));
const hybridRoot = fileURLToPath(new URL('../static-projects/build-hybrid', import.meta.url));
const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));

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
