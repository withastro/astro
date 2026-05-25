import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('passthroughImageService with content collections', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/passthrough-image-content/',
			outDir: './dist/passthrough-image-content/',
		});
		await fixture.build();
	});

	it('does not emit an empty srcset attribute on content-collection images', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const srcset = $('img').attr('srcset');
		assert.equal(srcset, undefined, 'srcset should not be present when using passthroughImageService');
	});

	it('includes the image with a valid src', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const src = $('img').attr('src');
		assert.ok(src, 'img should have a src attribute');
		assert.ok(src!.endsWith('.jpg'), `src should be a jpg, got: ${src}`);
	});
});
