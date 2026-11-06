import { fileURLToPath } from 'node:url';
import { build } from 'astro';
import { test } from 'vitest';

const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));

test('Bench build time', { timeout: 300000 }, async ({ bench }) => {
	await bench('Build: full server site', async () => {
		await build({
			root: serverRoot,
			logLevel: 'error',
		});
	}).run({ iterations: 3 });
});
