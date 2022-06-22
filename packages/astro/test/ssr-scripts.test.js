import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR Hydrated component scripts', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-scripts/',
			experimental: {
				ssr: true,
			},
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Are included in the manifest.assets so that an adapter can know to serve static', async () => {
		const app = await fixture.loadTestAdapterApp();

		/** @type {Set<string>} */
		const assets = app.manifest.assets;
		expect(assets.size).to.be.greaterThan(0);
	});
});
