import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('External dynamic import', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/external-dynamic-import/',
		});
		await fixture.build();
	});

	it('does not inline scripts containing __VITE_PRELOAD__ markers', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);

		// The script should NOT be inlined — it should remain as an external module script
		const inlineScripts = $('script[type="module"]').filter(function () {
			return !$(this).attr('src') && $(this).html()?.includes('__VITE_PRELOAD__');
		});
		assert.equal(
			inlineScripts.length,
			0,
			'Script with __VITE_PRELOAD__ marker should not be inlined into HTML',
		);

		// The script should be referenced as an external file
		const externalScripts = $('script[type="module"][src]');
		assert.ok(externalScripts.length > 0, 'Script should be emitted as an external file');
	});
});
