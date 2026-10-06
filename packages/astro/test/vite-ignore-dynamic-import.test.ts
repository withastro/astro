import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { generateCspDigest } from '../dist/core/encryption.js';
import { loadFixture } from './test-utils.ts';

describe('Ignored dynamic imports', () => {
	it('inlines scripts only after Vite replaces its preload markers', async () => {
		const fixture = await loadFixture({
			root: './fixtures/vite-ignore-dynamic-import/',
			outDir: './dist/inline/',
			security: { csp: true },
			vite: { build: { sourcemap: true } },
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const scripts = $('script[type="module"]');
		assert.equal(scripts.length, 1);
		assert.equal(scripts.attr('src'), undefined, 'The script should remain inline');
		assert.match(scripts.text(), /external\.js/);
		assert.doesNotMatch(html, /__VITE_PRELOAD__/);

		const digest = await generateCspDigest(scripts.text(), 'SHA-256');
		const csp = $('meta[http-equiv="Content-Security-Policy"]').attr('content');
		assert.ok(csp?.includes(`'${digest}'`), 'CSP must hash the processed inline script');
	});

	it('still emits valid external scripts when inlining is disabled', async () => {
		const fixture = await loadFixture({
			root: './fixtures/vite-ignore-dynamic-import/',
			outDir: './dist/external/',
			vite: { build: { assetsInlineLimit: 0 } },
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const scripts = $('script[type="module"]');
		assert.equal(scripts.length, 1);
		const src = scripts.attr('src');
		assert.ok(src, 'The script should remain external');
		const code = await fixture.readFile(src);
		assert.match(code, /external\.js/);
		assert.doesNotMatch(code, /__VITE_PRELOAD__/);
	});
});
