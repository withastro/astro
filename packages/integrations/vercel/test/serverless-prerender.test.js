import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('Serverless prerender', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/serverless-prerender/', import.meta.url),
		});
	});

	it('build successful', async () => {
		await fixture.build();
		expect(fixture.readFile('/static/index.html')).to.be.ok;
	});
});
