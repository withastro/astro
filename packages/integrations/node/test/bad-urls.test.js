import { expect } from 'chai';
import nodejs from '../dist/index.js';
import { loadFixture } from './test-utils.js';

describe('API routes', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/bad-urls/',
			output: 'server',
			adapter: nodejs({ mode: 'standalone' }),
		});
		await fixture.build();
		devPreview = await fixture.preview();
	});

	after(async () => {
		await devPreview.stop();
	});

	it('Does not crash on bad urls', async () => {
		const weirdURLs = [
			'/\\xfs.bxss.me%3Fastrojs.com/hello-world',
			'/asdasdasd@ax_zX=.zxczas🐥%/úadasd000%/',
			'%',
			'%80',
			'%c',
			'%c0%80',
			'%20foobar%',
		];

		for (const weirdUrl of weirdURLs) {
			const fetchResult = await fixture.fetch(weirdUrl);
			expect([400, 500]).to.include(
				fetchResult.status,
				`${weirdUrl} returned something else than 400 or 500`
			);
		}
		const stillWork = await fixture.fetch('/');
		const text = await stillWork.text();
		expect(text).to.equal('<!DOCTYPE html>Hello!');
	});
});
