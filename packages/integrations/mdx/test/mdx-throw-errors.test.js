import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX errors', () => {
	/** @type {import('../../../astro/test/test-utils.js').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-throw-error/', import.meta.url),
			integrations: [mdx()],
		});
	});

	it('throws error during the build (does not lock up)', async () => {
		try {
			await fixture.build();
			expect(false).to.equal(true);
		} catch(err) {
			expect(err.message).to.equal('Oh no');
		}
	});
});
