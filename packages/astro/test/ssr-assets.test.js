import { expect } from 'chai';
import { loadFixture } from './test-utils.js';
import testAdapter from '../dist/testing/ssr-adapter.js';

describe('SSR Assets', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/ssr-assets/', import.meta.url),
			output: 'server',
			adapter: testAdapter(),
		});
		await fixture.build();
	});

	it('Do not have to implement getStaticPaths', async () => {
		const { manifest } = await fixture.loadTestAdapterApp();
		/** @type {Set<string>} */
		const assets = manifest.assets;
		expect(assets.size).to.equal(1);
		expect(Array.from(assets)[0].endsWith('.css')).to.be.true;
	});
});
