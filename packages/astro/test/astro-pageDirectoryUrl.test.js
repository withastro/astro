import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('build format', () => {
	describe('build.format: file', () => {
		/** @type {import('./test-utils.js').Fixture} */
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

	describe('build.format: preserve', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/astro-page-directory-url',
				build: {
					format: 'preserve',
				},
			});
			await fixture.build();
		});
	
		it('outputs', async () => {
			expect(await fixture.readFile('/client.html')).to.be.ok;
			expect(await fixture.readFile('/nested-md/index.html')).to.be.ok;
			expect(await fixture.readFile('/nested-astro/index.html')).to.be.ok;
		});
	});
});
