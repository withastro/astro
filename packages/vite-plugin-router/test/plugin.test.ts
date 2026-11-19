import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import astro from '@astrojs/vite-plugin-astro';
import { resolveConfig } from 'vite';
import router, { getRouterApi } from '../dist/index.js';

describe('router()', () => {
	it('throws a clear error when astro() is missing', async () => {
		await assert.rejects(
			resolveConfig({ configFile: false, logLevel: 'silent', plugins: [router()] }, 'serve'),
			/`astro\(\)` from @astrojs\/vite-plugin-astro is missing from the Vite `plugins` array/,
		);
	});

	it('finds astro() regardless of plugin order', async () => {
		for (const plugins of [
			[astro(), router()],
			[router(), astro()],
		]) {
			const config = await resolveConfig(
				{ configFile: false, logLevel: 'silent', plugins },
				'serve',
			);
			assert.ok(getRouterApi(config));
		}
	});
});

describe('api.astroRouter.config', () => {
	it("resolves srcDir against Vite's root", async () => {
		const root = fileURLToPath(new URL('./fixtures/basic/', import.meta.url));
		for (const [srcDir, expected] of [
			[undefined, './src/'],
			['./app', './app/'],
		] as const) {
			const config = await resolveConfig(
				{ root, configFile: false, logLevel: 'silent', plugins: [astro(), router({ srcDir })] },
				'serve',
			);
			assert.equal(
				getRouterApi(config).config.srcDir.href,
				new URL(expected, pathToFileURL(root)).href,
			);
		}
	});
});

describe('getRouterApi()', () => {
	it('throws when router() is not registered', async () => {
		const config = await resolveConfig(
			{ configFile: false, logLevel: 'silent', plugins: [astro()] },
			'serve',
		);
		assert.throws(
			() => getRouterApi(config),
			/`router\(\)` from @astrojs\/vite-plugin-router is missing/,
		);
	});
});
