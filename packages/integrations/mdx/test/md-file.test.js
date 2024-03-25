import mdx from '@astrojs/mdx';

import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/md-file/', import.meta.url);

describe('MD file', () => {
	it('parses as MDX when allowMd = true', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx({
					allowMd: true,
				}),
			],
		});

		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const title = document.querySelector('h1');

		assert.equal(title.textContent, 'Using JSX expressions in MDX');
	});
	it('parses as plain Markdown when allowMd = false', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx({
					allowMd: false,
				}),
			],
		});

		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const title = document.querySelector('h1');

		assert.equal(title.textContent, '{frontmatter.title}');
	});
	it('parses as plain Markdown when allowMd is undefined', async () => {
		const fixture = await buildFixture({
			integrations: [
				mdx(),
			],
		});

		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		const title = document.querySelector('h1');

		assert.equal(title.textContent, '{frontmatter.title}');
	});
});

async function buildFixture(config) {
	const fixture = await loadFixture({
		root: FIXTURE_ROOT,
		...config,
	});
	await fixture.build();
	return fixture;
}
