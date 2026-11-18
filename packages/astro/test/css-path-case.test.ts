import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

/**
 * Regression test for https://github.com/withastro/astro/issues/14013
 *
 * On case-insensitive filesystems (macOS, Windows) the dev server can be started
 * from a project root whose case differs from the actual on-disk case (e.g.
 * `d:\dev\app` vs `D:\dev\app`). `normalizeFilename` compares the configured
 * `root` against Vite-resolved module ids via `commonAncestorPath`, which is
 * case-sensitive. When the two disagree on case at the first path segment (a
 * Windows drive letter, or the leading directory on macOS) `commonAncestorPath`
 * returns `''`, so the absolute id is no longer recognized as project-internal
 * and gets rewritten to a bogus path. That misses the compile-metadata cache and
 * strips the component's scoped `<style>` from the page.
 *
 * To reproduce the discrepancy we flip the case of the first alphabetic
 * character of the root path. On a case-insensitive filesystem the flipped path
 * still resolves to the real fixture, while Vite resolves module ids with the
 * canonical case — exactly the mismatch from the issue. On a case-sensitive
 * filesystem (most Linux CI) the flipped path does not exist, so the suite is
 * skipped.
 */
const realRoot = fileURLToPath(new URL('./fixtures/css-path-case/', import.meta.url));

/** Flip the case of the first ASCII letter — the macOS leading dir or Windows drive letter. */
function flipFirstLetterCase(p: string): string {
	const i = p.search(/[a-zA-Z]/);
	if (i === -1) return p;
	const ch = p[i];
	const flipped = ch === ch.toLowerCase() ? ch.toUpperCase() : ch.toLowerCase();
	return p.slice(0, i) + flipped + p.slice(i + 1);
}

const caseMismatchedRoot = flipFirstLetterCase(realRoot);

// Detect a case-insensitive filesystem directly rather than checking the OS:
// the flipped-case path resolves to the real fixture only when the filesystem
// ignores case (macOS, Windows). This is the precondition the test needs and is
// more accurate than an OS check (macOS is case-insensitive too, and case
// sensitivity can vary per-volume/per-directory on both macOS and Windows).
const isCaseInsensitiveFs = caseMismatchedRoot !== realRoot && fs.existsSync(caseMismatchedRoot);

describe('CSS scoped styles with a case-mismatched project root', {
	skip: !isCaseInsensitiveFs,
}, () => {
	let fixture: Fixture;
	let devServer: DevServer;
	let $: cheerio.CheerioAPI;

	before(async () => {
		fixture = await loadFixture({ root: caseMismatchedRoot });
		devServer = await fixture.startDevServer();
		const html = await fixture.fetch('/').then((res) => res.text());
		$ = cheerio.load(html);
	});

	after(async () => {
		await devServer?.stop();
	});

	it('applies the scope to the element', () => {
		const h1 = $('h1');
		const scopedAttribute = Object.keys(h1[0]?.attribs ?? {}).find((key) =>
			/^data-astro-cid-/.test(key),
		);
		assert.ok(scopedAttribute, 'expected the <h1> to carry a data-astro-cid-* scope attribute');
	});

	it('injects the scoped style into the page (issue #14013)', () => {
		const injectedStyles = $('style').text().replace(/\s/g, '');
		assert.equal(
			injectedStyles.includes('color:#123456'),
			true,
			'expected the scoped <style> to be injected even though the root case differs from disk',
		);
	});
});
