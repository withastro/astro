import * as assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createLogger } from 'vite';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

describe('SSR dependencies', () => {
	let fixture: Fixture;
	let devServer: DevServer;
	const viteMessages: string[] = [];

	before(async () => {
		const logger = createLogger('info', { allowClearScreen: false });
		const origInfo = logger.info.bind(logger);
		const origWarn = logger.warn.bind(logger);
		const origError = logger.error.bind(logger);
		logger.info = (msg, opts) => {
			viteMessages.push(msg);
			origInfo(msg, opts);
		};
		logger.warn = (msg, opts) => {
			viteMessages.push(msg);
			origWarn(msg, opts);
		};
		logger.error = (msg, opts) => {
			viteMessages.push(msg);
			origError(msg, opts);
		};

		fixture = await loadFixture({
			root: './fixtures/ssr-deps/',
			vite: {
				customLogger: logger,
			},
		});

		// Clear Vite cache to ensure dependencies are discovered fresh
		const viteCacheDir = new URL('./node_modules/.vite/', fixture.config.root);
		rmSync(fileURLToPath(viteCacheDir), { recursive: true, force: true });

		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('should not fail the dep scan when .ts files import .astro components', async () => {
		// When a .ts file imports a .astro component with a default import
		// (e.g. `import Duration from './Duration.astro'`), the esbuild scan plugin
		// must provide a default export so the scan doesn't fail with
		// "No matching export for import 'default'".
		const scanFailedLog = viteMessages.find((msg) =>
			msg.includes('Failed to scan for dependencies'),
		);

		assert.ok(!scanFailedLog, `Dependency scan should not have failed, but got: ${scanFailedLog}`);
	});

	it('should discover dependencies in nested .astro component imports ahead of time', async () => {
		// The `ms` dependency is only imported from Duration.astro (a nested component),
		// which is imported via a .ts utility file.
		// The scanner must follow: index.astro → get-renderers.ts → Duration.astro → ms
		const res = await fixture.fetch('/');
		const html = await res.text();

		// Verify the page rendered correctly with the dependency from the nested component
		assert.ok(html.includes('3600000'), 'Expected ms("1 hour") to compute 3600000');
	});
});
