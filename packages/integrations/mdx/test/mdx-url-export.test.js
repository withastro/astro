import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('MDX url export', () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-url-export/', import.meta.url),
			integrations: [mdx()],
		});

		await fixture.build();
	});

	it('generates correct urls in glob result', async () => {
		const { urls } = JSON.parse(await fixture.readFile('/pages.json'));
		expect(urls).to.include('/test-1');
		expect(urls).to.include('/test-2');
	});

	it('respects "export url" overrides in glob result', async () => {
		const { urls } = JSON.parse(await fixture.readFile('/pages.json'));
		expect(urls).to.include('/AH!');
	});
});
