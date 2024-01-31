import mdx from '@astrojs/mdx';

import { describe, it, before } from 'node:test';
import * as assert from 'node:assert/strict';
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
		assert.equal($('p').text(), 'First mdx file');
		assert.equal($('#one').text(), 'hello', 'Frontmatter included');
		assert.equal($('#url').text(), 'src/content/1.mdx', 'url is included');
		assert.equal(
			$('#file').text().includes('fixtures/mdx-get-static-paths/src/content/1.mdx'),
			true,
			'file is included'
		);
	});
});
