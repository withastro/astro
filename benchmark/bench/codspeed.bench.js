import { fileURLToPath } from 'node:url';
import { bench, describe } from 'vitest';
import { build } from 'astro';

const staticRoot = fileURLToPath(new URL('../static-projects/build-static', import.meta.url));
const hybridRoot = fileURLToPath(new URL('../static-projects/build-hybrid', import.meta.url));
const serverRoot = fileURLToPath(new URL('../static-projects/build-server', import.meta.url));

describe('Bench build time', () => {
	bench('Build: full static site', async () => {
		await build({
			root: staticRoot,
		});
	}, { timeout: 300000 });

	bench('Build: hybrid site (static + server)', async () => {
		await build({
			root: hybridRoot,
		});
	}, { timeout: 300000 });

	bench('Build: full server site', async () => {
		await build({
			root: serverRoot,
		});
	}, { timeout: 300000 });
});
