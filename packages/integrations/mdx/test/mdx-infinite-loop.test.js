import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';

import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX Infinite Loop', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-infinite-loop/', import.meta.url),
			integrations: [mdx(), preact()],
		});
	});

	describe('build', () => {
		let err;
		before(async () => {
			try {
				await fixture.build();
			} catch (e) {
				err = e;
			}
		});

		it('does not hang forever if an error is thrown', async () => {
			expect(!!err).to.be.true;
		});
	});
});
