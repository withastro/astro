import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	type Fixture,
	type AstroInlineConfig,
	loadFixture,
	getVercelConfig,
} from './test-utils.ts';

describe('Static Assets', () => {
	let fixture: Fixture;

	const VALID_CACHE_CONTROL = 'public, max-age=31536000, immutable';

	async function build({
		adapter,
		assets,
		output,
	}: {
		adapter?: AstroInlineConfig['adapter'];
		assets?: string;
		output?: AstroInlineConfig['output'];
	}) {
		fixture = await loadFixture({
			root: './fixtures/static-assets/',
			output,
			adapter,
			build: {
				assets,
			},
		});
		await fixture.build({});
	}

	async function getAssets() {
		return fixture.config.build.assets;
	}

	async function checkValidCacheControl(assets?: string) {
		const config = await getVercelConfig(fixture);
		const theAssets = assets ?? (await getAssets());

		const routeIndex = config.routes.findIndex(
			(r) => r.headers?.['cache-control'] === VALID_CACHE_CONTROL,
		);
		assert.notEqual(routeIndex, -1, 'expected a cache-control rule for hashed assets');
		const route = config.routes[routeIndex];
		assert.equal(route.src, `^/${theAssets.replaceAll('.', '\\.')}(?:/(.*))$`);
		assert.equal(route.continue, true);

		const handleIndex = config.routes.findIndex((r) => r.handle === 'filesystem');
		assert.notEqual(handleIndex, -1, 'expected a filesystem handle');
		assert.ok(
			routeIndex < handleIndex,
			`expected the cache-control rule (index ${routeIndex}) before the filesystem handle (index ${handleIndex})`,
		);
	}

	describe('static adapter', () => {
		it('has cache control', { timeout: 30000 }, async () => {
			const { default: vercel } = await import('@astrojs/vercel');
			await build({
				adapter: vercel(),
			});
			await checkValidCacheControl();
		});

		it('has cache control other assets', { timeout: 30000 }, async () => {
			const { default: vercel } = await import('@astrojs/vercel');
			const assets = '_foo';
			await build({
				adapter: vercel(),
				assets,
			});
			await checkValidCacheControl(assets);
		});
	});

	describe('serverless adapter', () => {
		it('has cache control', { timeout: 30000 }, async () => {
			const { default: vercel } = await import('@astrojs/vercel');
			await build({
				output: 'server',
				adapter: vercel(),
			});
			await checkValidCacheControl();
		});

		it('has cache control other assets', { timeout: 30000 }, async () => {
			const { default: vercel } = await import('@astrojs/vercel');
			const assets = '_foo';
			await build({
				output: 'server',
				adapter: vercel(),
				assets,
			});
			await checkValidCacheControl(assets);
		});
	});
});
