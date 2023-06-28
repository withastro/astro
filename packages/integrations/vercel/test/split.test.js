import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('build: split', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/basic/',
			output: 'server',
			build: {
				split: true,
			}
		});
		await fixture.build();
	});

	it('creates separate functions for each page', async () => {
		const files = await fixture.readdir('../.vercel/output/functions/')
		expect(files.length).to.equal(2);
	});
});
