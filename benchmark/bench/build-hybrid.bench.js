import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { test } from 'vitest';

const hybridRoot = fileURLToPath(new URL('../static-projects/build-hybrid', import.meta.url));

test('Bench build time', { timeout: 300000 }, async ({ bench }) => {
	await bench('Build: hybrid site (static + server)', async () => {
		await build({
			root: hybridRoot,
			logLevel: 'error',
		});
	}).run({ iterations: 3 });
});
