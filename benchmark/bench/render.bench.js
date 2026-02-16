import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, bench, describe } from 'vitest';

const renderRoot = new URL('../projects/render-bench/', import.meta.url);

/**
 * Configuration matrix for queue rendering features.
 * We test combinations of: enabled × poolSize × cache
 *
 * - enabled: Use queue-based rendering (vs classic recursive)
 * - poolSize: Node pool size (1000 for enabled, 0 for disabled)
 * - cache: Enable HTMLString caching
 */
const CONFIGS = [
	// Classic rendering (no queue)
	{ enabled: false, poolSize: 0, contentCache: false, label: 'Classic' },

	// Queue rendering with various optimization combinations
	{ enabled: true, poolSize: 0, contentCache: false, label: 'Queue' },
	{ enabled: true, poolSize: 1000, contentCache: false, label: 'Queue+Pool' },
	{ enabled: true, poolSize: 0, contentCache: true, label: 'Queue+ContentCache' },
	{ enabled: true, poolSize: 1000, contentCache: true, label: 'Queue+Pool+ContentCache' },
];

/**
 * Test matrix dimensions
 */
const FILE_TYPES = [
	{ route: '/astro', label: '.astro' },
	{ route: '/md', label: '.md' },
	{ route: '/mdx', label: '.mdx' },
];

const STREAMING_MODES = [
	{ streaming: true, label: 'streaming' },
	{ streaming: false, label: 'buffered' },
];

/**
 * Apps organized by: [streamingMode][configLabel]
 * We create one app per config+streaming combination and reuse it for all file types.
 */
const apps = {};

beforeAll(async () => {
	const entry = new URL('./dist/server/entry.mjs', renderRoot);

	if (!existsSync(fileURLToPath(entry))) {
		throw new Error(
			'render-bench project not built. Please run `pnpm run build:bench` before running the benchmarks.',
		);
	}

	// Import App class and manifest
	const { App, manifest } = await import(entry);

	if (!App) {
		throw new Error(
			'App class not exported from adapter. Please rebuild the adapter and bench project.',
		);
	}

	// Create app instances for all config × streaming combinations
	for (const { streaming } of STREAMING_MODES) {
		apps[streaming] = {};

		for (const config of CONFIGS) {
			// Clone and modify manifest with queue rendering config
			const modifiedManifest = {
				...manifest,
				experimentalQueuedRendering: {
					enabled: config.enabled,
					poolSize: config.poolSize,
					contentCache: config.contentCache,
				},
			};

			// Directly instantiate App with the modified manifest
			apps[streaming][config.label] = new App(modifiedManifest, streaming);
		}
	}
}, 900000);

// Generate benchmarks: fileType × streaming × config
for (const { route, label: fileLabel } of FILE_TYPES) {
	for (const { streaming, label: streamLabel } of STREAMING_MODES) {
		describe(`${fileLabel} [${streamLabel}]`, () => {
			for (const config of CONFIGS) {
				bench(config.label, async () => {
					const app = apps[streaming][config.label];
					const request = new Request(new URL(`http://example.com${route}`));
					await app.render(request);
				});
			}
		});
	}
}
