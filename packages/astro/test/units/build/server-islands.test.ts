import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Plugin } from 'vite';
import { AstroBuilder } from '../../../dist/core/build/index.js';
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

function forceDoubleQuotedServerIslandPlaceholders(): Plugin {
	return {
		name: 'force-double-quoted-server-island-placeholders',
		enforce: 'pre',
		renderChunk(code: string) {
			if (!code.includes("'$$server-islands-map$$'")) {
				return;
			}

			return {
				code: code
					.replace(/'\$\$server-islands-map\$\$'/g, () => '"$$server-islands-map$$"')
					.replace(/'\$\$server-islands-name-map\$\$'/g, () => '"$$server-islands-name-map$$"'),
				map: null,
			};
		},
	};
}

describe('Build: Server islands in prerendered pages', () => {
	it('builds successfully when server:defer is only used in prerendered pages', async () => {
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
						'src/components/Island.astro': [
							'---',
							'---',
							'<h2 id="island">I am a server island</h2>',
						].join('\n'),
						'src/pages/index.astro': [
							'---',
							"import Island from '../components/Island.astro';",
							'export const prerender = true;',
							'---',
							'<html>',
							'<head><title>Test</title></head>',
							'<body>',
							'<Island server:defer />',
							'</body>',
							'</html>',
						].join('\n'),
					}),
				],
			},
		});

		const routesList = {
			routes: [
				parseRoute('index.astro', settings, {
					component: 'src/pages/index.astro',
					prerender: true,
				}),
			],
		};

		// Inject the server island route — normally createRoutesList does this
		const { injectServerIslandRoute } = await import(
			'../../../dist/core/server-islands/endpoint.js'
		);
		injectServerIslandRoute(settings.config, routesList);

		process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';

		try {
			const builder = new AstroBuilder(settings, {
				logger: defaultLogger,
				mode: 'production',
				runtimeMode: 'production',
				teardownCompiler: false,
				routesList,
				sync: false,
			});
			await builder.run();
		} finally {
			delete process.env.ASTRO_KEY;
		}

		const serverOutputDir = fileURLToPath(settings.config.build.server);
		const outputFiles = await readFilesRecursive(serverOutputDir);
		const manifestFilePath = outputFiles.find((file) => file.includes('server-island-manifest'));
		const manifestContent = manifestFilePath ? await fs.readFile(manifestFilePath, 'utf-8') : null;

		assert.ok(manifestContent, 'Server island manifest chunk should be emitted');

		assert.ok(
			/["']Island["']/.test(manifestContent),
			`Server island manifest should contain Island component but got:\n${manifestContent}`,
		);
		assert.ok(
			/serverIslandMap\s*=\s*new Map\(/.test(manifestContent),
			`Server island map should be materialized in output but got:\n${manifestContent}`,
		);
		assert.ok(
			/serverIslandNameMap\s*=\s*new Map\(/.test(manifestContent),
			`Server island name map should be materialized in output but got:\n${manifestContent}`,
		);
		assert.ok(
			!manifestContent.includes('$$server-islands-map$$') &&
				!manifestContent.includes('$$server-islands-name-map$$'),
			`Server island manifest should not include placeholders but got:\n${manifestContent}`,
		);

		assert.ok(manifestFilePath, 'Server island manifest chunk path should exist');
		const manifestModule = await import(pathToFileURL(manifestFilePath).href);
		const islandLoader = manifestModule.serverIslandMap.get('Island');
		assert.equal(typeof islandLoader, 'function', 'Island loader should be a function');
		await assert.doesNotReject(
			async () => islandLoader(),
			'Server island chunk import should resolve at runtime',
		);
	});

	it('replaces server island placeholders even when quote style changes in generated chunks', async () => {
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
						'src/components/Island.astro': [
							'---',
							'---',
							'<h2 id="island">I am a server island</h2>',
						].join('\n'),
						'src/pages/index.astro': [
							'---',
							"import Island from '../components/Island.astro';",
							'export const prerender = true;',
							'---',
							'<html>',
							'<head><title>Test</title></head>',
							'<body>',
							'<Island server:defer />',
							'</body>',
							'</html>',
						].join('\n'),
					}),
					forceDoubleQuotedServerIslandPlaceholders(),
				],
			},
		});

		const routesList = {
			routes: [
				parseRoute('index.astro', settings, {
					component: 'src/pages/index.astro',
					prerender: true,
				}),
			],
		};

		const { injectServerIslandRoute } = await import(
			'../../../dist/core/server-islands/endpoint.js'
		);
		injectServerIslandRoute(settings.config, routesList);

		process.env.ASTRO_KEY = 'eKBaVEuI7YjfanEXHuJe/pwZKKt3LkAHeMxvTU7aR0M=';

		try {
			const builder = new AstroBuilder(settings, {
				logger: defaultLogger,
				mode: 'production',
				runtimeMode: 'production',
				teardownCompiler: false,
				routesList,
				sync: false,
			});
			await builder.run();
		} finally {
			delete process.env.ASTRO_KEY;
		}

		const serverOutputDir = fileURLToPath(settings.config.build.server);
		const outputFiles = await readFilesRecursive(serverOutputDir);
		const manifestFilePath = outputFiles.find((file) => file.includes('server-island-manifest'));
		const manifestContent = manifestFilePath ? await fs.readFile(manifestFilePath, 'utf-8') : null;

		assert.ok(manifestContent, 'Server island manifest chunk should be emitted');
		assert.ok(
			/['"]Island['"]/.test(manifestContent),
			`Server island manifest should contain Island component but got:\n${manifestContent}`,
		);
		assert.ok(
			/serverIslandMap\s*=\s*new Map\(/.test(manifestContent),
			`Server island map should be materialized in output but got:\n${manifestContent}`,
		);
		assert.ok(
			/serverIslandNameMap\s*=\s*new Map\(/.test(manifestContent),
			`Server island name map should be materialized in output but got:\n${manifestContent}`,
		);
		assert.ok(
			!manifestContent.includes('$$server-islands-map$$') &&
				!manifestContent.includes('$$server-islands-name-map$$'),
			`Server island manifest should not include placeholders but got:\n${manifestContent}`,
		);

		assert.ok(manifestFilePath, 'Server island manifest chunk path should exist');
		const manifestModule = await import(pathToFileURL(manifestFilePath).href);
		const islandLoader = manifestModule.serverIslandMap.get('Island');
		assert.equal(typeof islandLoader, 'function', 'Island loader should be a function');
		await assert.doesNotReject(
			async () => islandLoader(),
			'Server island chunk import should resolve at runtime',
		);
	});
});
