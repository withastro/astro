import { expect } from 'chai';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('Image endpoint', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/image/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
			experimental: {
				assets: true,
			},
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('it returns images', async () => {
		const res = await fixture.fetch('/');
		expect(res.status).to.equal(200);

		const resImage = await fixture.fetch(
			'/_image?href=/_astro/some_penguin.97ef5f92.png&w=50&f=webp'
		);

		expect(resImage.status).to.equal(200);
	});
});
