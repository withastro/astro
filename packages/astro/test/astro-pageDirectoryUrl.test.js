import { loadFixture } from './test-utils.js';
import { expect } from 'chai';

describe('build format', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-page-directory-url',
			build: {
				format: 'file',
			},
		});
		await fixture.build();
	});

	it('outputs', async () => {
		expect(await fixture.readFile('/client.html')).to.be.ok;
		expect(await fixture.readFile('/nested-md.html')).to.be.ok;
		expect(await fixture.readFile('/nested-astro.html')).to.be.ok;
	});
});
