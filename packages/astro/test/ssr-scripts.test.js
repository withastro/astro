import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';

describe('SSR Hydrated component scripts', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-scripts/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Are included in the manifest.assets so that an adapter can know to serve static', async () => {
		const { manifest } = await fixture.loadTestAdapterApp();

		/** @type {Set<string>} */
		const assets = manifest.assets;
		expect(assets.size).to.be.greaterThan(0);
	});
});
