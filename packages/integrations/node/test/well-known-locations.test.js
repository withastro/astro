import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('test URIs beginning with a dot', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/well-known-locations/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
	});

	describe('can load well-known URIs', async () => {
		let devPreview;

		before(async () => {
			devPreview = await fixture.preview();
		});

		after(async () => {
			await devPreview.stop();
		});

		it('can load a valid well-known URI', async () => {
			const res = await fixture.fetch('/.well-known/apple-app-site-association');

			expect(res.status).to.equal(200);

			const json = await res.json();

			expect(json).to.deep.equal({ applinks: {} });
		});

		it('cannot load a dot folder that is not a well-known URI', async () => {
			const res = await fixture.fetch('/.hidden/file.json');

			expect(res.status).to.equal(404);
		});
	});
});
