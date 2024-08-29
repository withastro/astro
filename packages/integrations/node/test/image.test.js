import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

// Temporary skip until we figure out the "Could not find Sharp" issue as `sharp` is bundled
describe.skip('Image endpoint', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/image/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('it returns images', async () => {
		const res = await fixture.fetch('/');
		assert.equal(res.status, 200);

		const resImage = await fixture.fetch(
			'/_image?href=/_astro/some_penguin.97ef5f92.png&w=50&f=webp'
		);

		assert.equal(resImage.status, 200);
	});
});
