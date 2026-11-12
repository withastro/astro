import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { test } from 'vitest';

const staticRoot = fileURLToPath(new URL('../static-projects/build-static', import.meta.url));

test('Bench build time', { timeout: 300000 }, async ({ bench }) => {
	await bench('Build: full static site', async () => {
		await build({
			root: staticRoot,
			logLevel: 'error',
		});
	}).run({ iterations: 3 });
});
