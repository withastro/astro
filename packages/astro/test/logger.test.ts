import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';
import testAdapter from './test-adapter.ts';

// A self-contained custom destination. `__custom` lets us assert this module was
// actually used, rather than a built-in fallback.
const LOGGER_MODULE = `export default function () {
	return { __custom: true, write() {} };
}
`;

describe('Logger', () => {
	// The custom destination must be bundled into the server output at build time. If it
	// were instead imported from the serialized manifest at runtime, it would fail to load
	// in a deployed bundle, where the configured entrypoint is no longer resolvable.
	describe('custom entrypoint', () => {
		let fixture: Fixture;
		let tempDir: string;

		before(async () => {
			// Kept outside the project so the built output cannot resolve it after deletion.
			tempDir = await mkdtemp(join(tmpdir(), 'astro-logger-'));
			const entrypoint = join(tempDir, 'logger.mjs');
			await writeFile(entrypoint, LOGGER_MODULE);

			fixture = await loadFixture({
				root: './fixtures/ssr-assets/',
				outDir: './dist/logger-custom-entrypoint/',
				cacheDir: './node_modules/.astro-test/logger-custom-entrypoint/',
				output: 'server',
				adapter: testAdapter(),
				logger: { entrypoint: pathToFileURL(entrypoint) },
			});
			await fixture.build();

			// Simulates a deployed bundle: only the build output remains.
			await rm(tempDir, { recursive: true, force: true });
		});

		after(async () => {
			await rm(tempDir, { recursive: true, force: true });
		});

		it('bundles and uses the custom logger at runtime (SSR)', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/'));
			assert.equal(response.status, 200);

			const destination = app.logger.options.destination;
			assert.ok(destination, 'Logger destination should exist');
			// @ts-expect-error __custom is not part of the destination type
			assert.equal(destination.__custom, true, 'Should use the custom logger');
		});
	});

	// A path relative to the project root, resolved the same way whether the destination is
	// instantiated by Node at build time or bundled into the server output by Vite.
	describe('relative entrypoint', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/ssr-assets/',
				outDir: './dist/logger-relative-entrypoint/',
				cacheDir: './node_modules/.astro-test/logger-relative-entrypoint/',
				output: 'server',
				adapter: testAdapter(),
				logger: { entrypoint: './src/logger.mjs' },
			});
			await fixture.build();
		});

		it('bundles and uses the custom logger at runtime (SSR)', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/'));
			assert.equal(response.status, 200);

			const destination = app.logger.options.destination;
			assert.ok(destination, 'Logger destination should exist');
			// @ts-expect-error __relative is not part of the destination type
			assert.equal(destination.__relative, true, 'Should use the custom logger');
		});
	});
});
