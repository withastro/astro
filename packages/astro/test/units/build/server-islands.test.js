import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { AstroBuilder } from '../../../dist/core/build/index.js';
import { parseRoute } from '../../../dist/core/routing/parse-route.js';
import { createBasicSettings, defaultLogger } from '../test-utils.js';
import { virtualAstroModules } from './test-helpers.js';

async function readFilesRecursive(dir) {
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
			!manifestContent.includes('$$server-islands-map$$'),
			`Server island manifest should not include placeholders but got:\n${manifestContent}`,
		);
	});
});
