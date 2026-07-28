import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('i18n fallback with build.concurrency', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/i18n-concurrent-fallback/',
		});
		await fixture.build();
	});

	it('generates the slow fallback page without NoMatchingStaticPathFound', async () => {
		const html = await fixture.readFile('/es/articles/slow-page/index.html');
		assert.ok(html.includes('Slow Page'));
	});

	it('generates fast fallback pages', async () => {
		const html = await fixture.readFile('/es/articles/fast-page-1/index.html');
		assert.ok(html.includes('Fast Page 1'));
	});

	it('generates original pages', async () => {
		const html = await fixture.readFile('/articles/slow-page/index.html');
		assert.ok(html.includes('Slow Page'));
	});

	it('generates catch-all pages', async () => {
		const html = await fixture.readFile('/about/index.html');
		assert.ok(html.includes('About'));
	});
});
