import { expect } from 'chai';
import { loadFixture } from './test-utils.js';

describe('Custom 404 with injectRoute from dependency', () => {
	describe('build', () => {
		/** @type {import('./test-utils.js').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/custom-404-injected-from-dep/',
				site: 'http://example.com',
			});
			await fixture.build();
		});

		it('Build succeeds', async () => {
			const html = await fixture.readFile('/404.html');
			expect(html).to.contain('<!DOCTYPE html>');
		});
	});
});
