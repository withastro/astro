import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Redirects Serverless', () => {
	/** @type {import('astro/test/test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/redirects-serverless/',
			redirects: {
				'/one': '/',
				'/other': '/subpage',
			},
		});
		await fixture.build();
	});

	it('does not create .html files', async () => {
		let hasErrored = false;
		try {
			await fixture.readFile('../.vercel/output/static/other/index.html');
		} catch {
			hasErrored = true;
		}
		expect(hasErrored).to.equal(true, 'this file should not exist');
	});
});
