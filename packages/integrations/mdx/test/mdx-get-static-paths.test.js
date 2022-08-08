import mdx from '@astrojs/mdx';

import { expect } from 'chai';
import { loadFixture } from '../../../astro/test/test-utils.js';
import * as cheerio from 'cheerio';

const FIXTURE_ROOT = new URL('./fixtures/mdx-get-static-paths', import.meta.url);

describe('getStaticPaths', () => {
	/** @type {import('astro/test/test-utils').Fixture} */
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
			integrations: [mdx()],
		});
		await fixture.build();
	});

	it('Provides file and url', async () => {
		const html = await fixture.readFile('/one/index.html');

		const $ = cheerio.load(html);
		expect($('p').text()).to.equal('First mdx file');
		expect($('#one').text()).to.equal('hello', 'Frontmatter included');
		expect($('#url').text()).to.equal('/src/content/1.mdx', 'url is included');
		expect($('#file').text()).to.contain(
			'fixtures/mdx-get-static-paths/src/content/1.mdx',
			'file is included'
		);
	});
});
