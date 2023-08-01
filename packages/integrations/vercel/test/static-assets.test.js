import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Static Assets', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;

	const VALID_CACHE_CONTROL = 'public, max-age=31536000, immutable';

	async function build({ adapter, assets }) {
		fixture = await loadFixture({
			root: './fixtures/static-assets/',
			adapter,
			build: {
				assets,
			}
		});
		await fixture.build();
	}

	async function getConfig() {
		const json = await fixture.readFile('../.vercel/output/config.json');
		const config = JSON.parse(json);

		return config;
	}

	async function getAssets() {
		return fixture.config.build.assets;
	}

	async function checkValidCacheControl(assets) {
		const config = await getConfig();

		const route = config.routes.find((r) => r.src === `^/${assets ?? getAssets()}/(.*)$`);
		expect(route.headers['cache-control']).to.equal(VALID_CACHE_CONTROL);
		expect(route.continue).to.equal(true);
	}

	describe('static adapter', async () => {
		const adapter = await import('@astrojs/vercel/static');

		it('has cache control', async () => {
			await build({ adapter });
			checkValidCacheControl();
		});

		it('has cache control other assets', async () => {
			const assets = '_foo';
			await build({ adapter, assets });
			checkValidCacheControl(assets);
		});
	});

	describe('serverless adapter', async () => {
		const adapter = await import('@astrojs/vercel/serverless');

		it('has cache control', async () => {
			await build({ adapter });
			checkValidCacheControl();
		});

		it('has cache control other assets', async () => {
			const assets = '_foo';
			await build({ adapter, assets });
			checkValidCacheControl(assets);
		});
	});

	describe('edge adapter', async () => {
		const adapter = await import('@astrojs/vercel/edge');

		it('has cache control', async () => {
			await build({ adapter });
			checkValidCacheControl();
		});

		it('has cache control other assets', async () => {
			const assets = '_foo';
			await build({ adapter, assets });
			checkValidCacheControl(assets);
		});
	});
});
