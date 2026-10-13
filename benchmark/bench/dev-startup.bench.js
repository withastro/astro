import { fileURLToPath } from 'node:url';
import { beforeAll, bench, describe } from 'vitest';
import { makeProject } from './_util.js';
import { measureDevStartup } from './dev-startup.js';

const projectRoot = new URL('../projects/dev-startup/', import.meta.url);

let root;

beforeAll(async () => {
	await makeProject('dev-startup');
	root = fileURLToPath(projectRoot);

	// Warm the project (OS file caches, `.astro` types, content data store,
	// Vite dep optimizer) so every measured iteration reflects a steady-state
	// `astro dev` start rather than a first-ever run.
	await measureDevStartup(root);
}, 900000);

describe('Bench dev server startup', () => {
	// The ready bench deliberately skips the first request: on branches that
	// defer the dev server app compile past "ready", the first request waits
	// for that compile, which would otherwise cancel out the ready-time signal.
	bench(
		'Dev server startup: time to ready',
		async () => {
			const { readyMs } = await measureDevStartup(root, { fetchOnReady: false });
			return readyMs;
		},
		{ timeout: 120000, iterations: 5 },
	);

	bench(
		'Dev server startup: time to first response (200)',
		async () => {
			const { firstResponseMs } = await measureDevStartup(root);
			return firstResponseMs;
		},
		{ timeout: 120000, iterations: 5 },
	);
});
