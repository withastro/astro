import * as assert from 'node:assert/strict';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
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

		// Create a fake package that imports a .data file via ?raw. Without the
		// fix for issue #16491, the SSR dep optimizer would fail with
		// "No loader is configured for .data files" even when the user sets
		// optimizeDeps.exclude, because the Cloudflare adapter was not forwarding
		// that setting to server environments.
		const pkgDir = new URL('./node_modules/fake-data-pkg/', fixture.config.root);
		mkdirSync(fileURLToPath(pkgDir), { recursive: true });
		writeFileSync(
			fileURLToPath(new URL('./package.json', pkgDir)),
			JSON.stringify({ name: 'fake-data-pkg', type: 'module', exports: './index.js' }),
		);
		writeFileSync(fileURLToPath(new URL('./bindings.data', pkgDir)), 'FAKE_BINARY_DATA\n');
		writeFileSync(
			fileURLToPath(new URL('./index.js', pkgDir)),
			`import data from './bindings.data?raw';\nexport default data;\n`,
		);

		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
		const pkgDir = new URL('./node_modules/fake-data-pkg/', fixture.config.root);
		rmSync(fileURLToPath(pkgDir), { recursive: true, force: true });
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

	it('should respect user optimizeDeps.exclude in SSR environments', async () => {
		// fake-data-pkg is excluded via optimizeDeps.exclude in astro.config.mjs.
		// Without the fix, the Cloudflare adapter ignored that setting for server
		// environments, causing esbuild to fail on the .data import (#16491).
		const res = await fixture.fetch('/');
		const html = await res.text();

		assert.equal(res.status, 200, `Expected 200, got ${res.status}. Body: ${html}`);
		assert.ok(
			html.includes('FAKE_BINARY_DATA'),
			`Expected page to render fake-data-pkg content, got: ${html}`,
		);
	});
});
