import assert from 'node:assert/strict';
import fs from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AstroBuilder } from '../../../dist/core/build/index.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createBasicSettings, defaultLogger } from '../test-utils.js';
import { captureBuildOutput, virtualAstroModules } from './test-helpers.js';

describe('Build: Server islands in prerendered pages', () => {
	it('builds successfully when server:defer is only used in prerendered pages', async () => {
		const root = new URL('./_temp-fixtures/', import.meta.url);
		const capture = captureBuildOutput();

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
					capture,
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
		} catch {
			// Generation may fail since chunks aren't written to disk — that's OK,
			// we only need the captured chunks to inspect the manifest.
		} finally {
			delete process.env.ASTRO_KEY;
			// Clean up any build output that may have been written
			const outDir = new URL('dist/', root);
			fs.rmSync(fileURLToPath(outDir), { recursive: true, force: true });
		}

		// Find the server island manifest among captured chunks
		let manifestContent = null;
		for (const [name, chunk] of capture.chunks) {
			if (name.includes('server-island-manifest') && chunk.type === 'chunk') {
				manifestContent = chunk.code;
				break;
			}
		}

		assert.ok(manifestContent, 'Server island manifest chunk should be captured');

		assert.ok(
			manifestContent.includes("'Island'"),
			`Server island manifest should contain Island component but got:\n${manifestContent}`,
		);
		assert.ok(
			!manifestContent.includes('new Map()'),
			`Server island manifest should not have empty maps but got:\n${manifestContent}`,
		);
	});
});
