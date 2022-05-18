import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from './test-adapter.js';

describe('SSR Assets', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-assets/',
			experimental: {
				ssr: true,
			},
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Do not have to implement getStaticPaths', async () => {
		const app = await fixture.loadTestAdapterApp();
		/** @type {Set<string>} */
		const assets = app.manifest.assets;
		expect(assets.size).to.equal(1);
		expect(Array.from(assets)[0].endsWith('.css')).to.be.true;
	});
});
