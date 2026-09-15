import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { AstroBuilder } from '../../../dist/core/build/index.js';
import { MANIFEST_REPLACE } from '../../../dist/core/build/plugins/plugin-manifest.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createBasicSettings, defaultLogger } from '../test-utils.ts';
import { virtualAstroModules } from './test-helpers.ts';

async function readFilesRecursive(dir: string): Promise<string[]> {
	const entries = await fs.readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				return readFilesRecursive(fullPath);
			}
			return [fullPath];
		}),
	);
	return files.flat();
}

/**
 * Vite plugin that enables minification for the SSR environment.
 * This simulates what an integration would do via `astro:build:setup`.
 */
function enableSsrMinification(): Plugin {
	return {
		name: 'test-enable-ssr-minification',
		configEnvironment(environmentName, config) {
			if (environmentName === 'ssr') {
				config.build ??= {};
				config.build.minify = true;
			}
		},
	};
}

describe('Build: Manifest injection', () => {
	it('replaces manifest placeholder when server build is minified', async () => {
		const root = new URL('./_temp-fixtures/', import.meta.url);

		const settings = await createBasicSettings({
			root: fileURLToPath(root),
			output: 'server',
			adapter: {
				name: 'test-adapter',
				hooks: {
					'astro:config:done': ({ setAdapter }) => {
						setAdapter({
							name: 'test-adapter',
							serverEntrypoint: 'astro/app',
							exports: ['manifest', 'createApp'],
							supportedAstroFeatures: {
								serverOutput: 'stable',
							},
							adapterFeatures: {
								buildOutput: 'server',
							},
						});
					},
				},
			},
			vite: {
				plugins: [
					virtualAstroModules(root, {
						'src/pages/index.astro': [
							'---',
							'---',
							'<html>',
							'<head><title>Test</title></head>',
							'<body><h1>Hello</h1></body>',
							'</html>',
						].join('\n'),
					}),
					enableSsrMinification(),
				],
			},
		});

		const routesList = {
			routes: [
				parseRoute('index.astro', settings, {
					component: 'src/pages/index.astro',
					prerender: false,
				}),
			],
		};

		process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';

		try {
			const builder = new AstroBuilder(settings, {
				logger: defaultLogger,
				mode: 'production',
				runtimeMode: 'production',
				routesList,
				sync: false,
			});
			await builder.run();
		} finally {
			delete process.env.ASTRO_KEY;
		}

		const serverOutputDir = fileURLToPath(settings.config.build.server);
		const outputFiles = await readFilesRecursive(serverOutputDir);

		// Find all server output files and verify none contain the unsubstituted placeholder
		let foundManifestChunk = false;
		for (const file of outputFiles) {
			if (!file.endsWith('.mjs') && !file.endsWith('.js')) continue;
			const content = await fs.readFile(file, 'utf-8');
			if (content.includes('deserializeManifest') || content.includes('_deserializeManifest')) {
				foundManifestChunk = true;
				assert.ok(
					!content.includes(MANIFEST_REPLACE),
					`Manifest placeholder should be replaced in minified output but was found in ${path.basename(file)}`,
				);
			}
		}
		assert.ok(foundManifestChunk, 'Should find at least one chunk containing deserializeManifest');
	});
});
